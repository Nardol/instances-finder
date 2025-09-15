use anyhow::{anyhow, Context, Result};
use clap::{Parser, Subcommand};
use std::env;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Instant;

#[derive(Parser)]
#[command(
    name = "xtask",
    version,
    about = "Dev helper for Instances Finder",
    propagate_version = true
)]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Diagnose the local development environment
    Doctor,
    /// Ensure local CLI deps (incl. @tauri-apps/cli) are installed
    EnsureCli,
    /// Run the app in dev mode (Vite + Tauri)
    Dev,
    /// Build targets (web, linux packages, windows bundles)
    Build {
        #[command(subcommand)]
        target: BuildTarget,
    },
    /// Prepare toolchains (e.g., Windows cross target)
    Prep {
        #[command(subcommand)]
        target: PrepTarget,
    },
    /// Formatting (js, rust, all)
    Fmt {
        #[arg(value_enum)]
        which: FmtWhich,
    },
    /// Lint JS/TS (optionally fix)
    Lint {
        #[arg(long)]
        fix: bool,
    },
    /// Format check (prettier --check or rustfmt --check)
    FmtCheck {
        #[arg(value_enum)]
        which: FmtWhich,
    },
    /// TypeScript type check (tsc --noEmit)
    TsCheck,
    /// Rust Clippy lint (with -D warnings)
    Clippy,
    /// Quick checks (JS lint + Rust clippy)
    Check,
    /// Quick checks in parallel (JS lint + Clippy)
    CheckPar,
    /// Full CI checks (JS lint+types+fmt, clippy, rustfmt --check)
    CiChecks,
    /// Full CI checks in parallel
    CiChecksPar,
    /// Benchmark sequential vs parallel checks
    Bench,
    /// Apply fixes (fmt + lint --fix)
    Fix,
    /// Clean build artifacts
    Clean,
    /// Install project dependencies (npm ci) and optional xtask release build
    Setup {
        /// Also precompile xtask in release for faster subsequent runs
        #[arg(long)]
        xtask_release: bool,
    },
    /// Release helpers (tag or GH draft)
    Release {
        #[command(subcommand)]
        action: ReleaseAction,
    },
}

#[derive(Subcommand, Clone, Copy)]
enum BuildTarget {
    /// Build web assets (Vite)
    Web,
    /// Build AppImage + Debian packages (Linux)
    Linux,
    /// Build AppImage only (Linux)
    Appimage,
    /// Build Debian package only (Linux)
    Deb,
    /// Cross-build Windows portable .exe
    WinExe,
    /// Cross-build Windows NSIS installer
    WinNsis,
    /// Create Windows portable .zip (mac/Linux host)
    WinZip,
}

#[derive(Subcommand, Clone, Copy)]
enum PrepTarget {
    /// Prepare Rust target for Windows cross-build
    Win,
}

#[derive(clap::ValueEnum, Clone, Copy)]
enum FmtWhich {
    All,
    Js,
    Rust,
}

#[derive(Subcommand, Clone)]
enum ReleaseAction {
    /// Create and push a git tag vX.Y.Z (VERSION)
    Tag { version: Option<String> },
    /// Create a GitHub draft release (VERSION and NOTES)
    Gh {
        version: Option<String>,
        #[arg(long)]
        notes: Option<String>,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Cmd::Doctor => doctor(),
        Cmd::EnsureCli => ensure_cli(),
        Cmd::Dev => dev(),
        Cmd::Build { target } => build(target),
        Cmd::Prep { target } => prep(target),
        Cmd::Fmt { which } => fmt_cmd(which),
        Cmd::Lint { fix } => lint_cmd(fix),
        Cmd::FmtCheck { which } => fmt_check_cmd(which),
        Cmd::TsCheck => ts_check_cmd(),
        Cmd::Clippy => clippy_cmd(),
        Cmd::Check => check_cmd(),
        Cmd::CheckPar => check_cmd_parallel(),
        Cmd::CiChecks => ci_checks_cmd(),
        Cmd::CiChecksPar => ci_checks_cmd_parallel(),
        Cmd::Bench => bench_cmd(),
        Cmd::Fix => fix_cmd(),
        Cmd::Clean => clean_cmd(),
        Cmd::Setup { xtask_release } => setup_cmd(xtask_release),
        Cmd::Release { action } => release_cmd(action),
    }
}

fn run(cmd: &str, args: &[&str]) -> Result<(i32, String)> {
    let out = Command::new(cmd)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .with_context(|| format!("spawn: {} {:?}", cmd, args))?;
    let code = out.status.code().unwrap_or(1);
    let mut s = String::from_utf8_lossy(&out.stdout).to_string();
    if s.trim().is_empty() {
        s = String::from_utf8_lossy(&out.stderr).to_string();
    }
    Ok((code, s))
}

fn ensure_cli() -> Result<()> {
    // If local tauri exists and runs, we are done
    if Path::new("node_modules/.bin/tauri").exists() {
        let (code, _) = run("node", &["node_modules/.bin/tauri", "--help"])?;
        if code == 0 {
            println!("[ensure-cli] ✓ Tauri CLI present (node_modules/.bin/tauri)");
            return Ok(());
        }
    }

    // Install devDeps, forcing production=false
    println!("[ensure-cli] Installing devDependencies (incl. @tauri-apps/cli)…");
    let mut cmd = Command::new("npm");
    cmd.arg("ci");
    cmd.env("NPM_CONFIG_PRODUCTION", "false");
    let status = cmd.status().context("npm ci failed")?;
    if !status.success() {
        // retry with npm install
        let mut cmd2 = Command::new("npm");
        cmd2.arg("install");
        cmd2.env("NPM_CONFIG_PRODUCTION", "false");
        let st2 = cmd2.status().context("npm install failed")?;
        if !st2.success() {
            return Err(anyhow!("npm install failed"));
        }
    }

    let (code, _) = run("node", &["node_modules/.bin/tauri", "--help"])?;
    if code != 0 {
        return Err(anyhow!(
            "[ensure-cli] ✗ Tauri CLI not available after install"
        ));
    }
    println!("[ensure-cli] ✓ Tauri CLI installed and available");
    Ok(())
}

fn dev() -> Result<()> {
    ensure_cli()?;
    let status = Command::new("npm")
        .arg("run")
        .arg("tauri:dev")
        .status()
        .context("failed to start npm run tauri:dev")?;
    if !status.success() {
        return Err(anyhow!("tauri:dev exited with failure"));
    }
    Ok(())
}

fn doctor() -> Result<()> {
    let mut ok = 0usize;
    let mut warn = 0usize;
    let mut fail = 0usize;
    let note = |s: &str| println!("[doctor] {}", s);
    let mut mark = |kind: &str, s: &str| match kind {
        "OK" => {
            ok += 1;
            println!("[  OK  ] {}", s)
        }
        "WARN" => {
            warn += 1;
            println!("[ WARN ] {}", s)
        }
        _ => {
            fail += 1;
            println!("[ FAIL ] {}", s)
        }
    };

    note("Running development environment checks…");

    // Node
    match run("node", &["-v"]) {
        Ok((c, vout)) if c == 0 => {
            let v = vout.trim().trim_start_matches('v');
            let major = v
                .split('.')
                .next()
                .unwrap_or("0")
                .parse::<u64>()
                .unwrap_or(0);
            if major >= 18 {
                mark("OK", &format!("Node.js {} (>=18)", v));
            } else {
                mark("FAIL", &format!("Node.js {} (<18)", v));
            }
        }
        _ => mark("FAIL", "Node.js not found"),
    }
    match run("npm", &["-v"]) {
        Ok((c, v)) if c == 0 => mark("OK", &format!("npm {}", v.trim())),
        _ => mark("FAIL", "npm not found"),
    }

    // Rust
    match run("rustc", &["--version"]) {
        Ok((c, v)) if c == 0 => mark("OK", &format!("Rust {}", v.trim())),
        _ => mark("FAIL", "rustc not found (install rustup + stable)"),
    }
    if which::which("rustup").is_ok() {
        let (c1, clippy) = run("rustup", &["component", "list", "--installed"])?;
        if c1 == 0 && clippy.contains("clippy") {
            mark("OK", "clippy installed");
        } else {
            mark("WARN", "clippy missing (rustup component add clippy)");
        }
        if c1 == 0 && clippy.contains("rustfmt") {
            mark("OK", "rustfmt installed");
        } else {
            mark("WARN", "rustfmt missing (rustup component add rustfmt)");
        }
    } else {
        mark("WARN", "rustup not found; cannot verify clippy/rustfmt");
    }

    // Tauri CLI local
    if Path::new("node_modules/.bin/tauri").exists() {
        let (code, _) = run("node", &["node_modules/.bin/tauri", "--help"])?;
        if code == 0 {
            mark("OK", "Tauri CLI found (local devDependency)");
        } else {
            mark("FAIL", "Tauri CLI present but not runnable");
        }
    } else {
        mark("WARN", "Tauri CLI not found locally. Run: make ensure-cli");
    }

    // Linux WebKitGTK (pkg-config)
    if which::which("pkg-config").is_ok() {
        let ok41 =
            run("pkg-config", &["--exists", "webkit2gtk-4.1"]).map_or(false, |(c, _)| c == 0);
        let ok40 =
            run("pkg-config", &["--exists", "webkit2gtk-4.0"]).map_or(false, |(c, _)| c == 0);
        if ok41 || ok40 {
            let (code, ver) = if ok41 {
                run("pkg-config", &["--modversion", "webkit2gtk-4.1"]).unwrap_or((1, String::new()))
            } else {
                run("pkg-config", &["--modversion", "webkit2gtk-4.0"]).unwrap_or((1, String::new()))
            };
            if code == 0 {
                mark(
                    "OK",
                    &format!("WebKitGTK dev found (webkit2gtk {})", ver.trim()),
                );
            } else {
                mark("OK", "WebKitGTK dev found");
            }
        } else {
            mark("WARN", "WebKitGTK dev not found via pkg-config");
        }
    }

    // Debian/Ubuntu packages if dpkg exists
    if which::which("dpkg").is_ok() {
        let pkgs = [
            "libwebkit2gtk-4.0-dev",
            "libwebkit2gtk-4.1-dev",
            "libgtk-3-dev",
            "libayatana-appindicator3-dev",
            "librsvg2-dev",
            "libsoup2.4-dev",
            "libjavascriptcoregtk-4.0-dev",
        ];
        let mut missing = vec![];
        for p in pkgs {
            let (c, _) = run("dpkg", &["-s", p])?;
            if c != 0 {
                missing.push(p);
            }
        }
        if missing.is_empty() {
            mark("OK", "Debian build deps present (GTK/WebKit/etc.)");
        } else {
            mark(
                "WARN",
                &format!("Missing Debian build deps: {}", missing.join(", ")),
            );
            println!(
                "[doctor] Install example: sudo apt-get install -y {}",
                missing.join(" ")
            );
        }
    }

    // Windows checks
    let os = env::var("OS").unwrap_or_default();
    let uname = run("uname", &["-s"]).map(|(_, s)| s).unwrap_or_default();
    let is_win = os.contains("Windows_NT")
        || uname.contains("MINGW")
        || uname.contains("MSYS")
        || uname.contains("CYGWIN");
    if is_win {
        if which::which("where").is_ok() {
            let (c, _) = run("where", &["makensis"])?;
            if c == 0 {
                mark("OK", "NSIS (makensis) present");
            } else {
                mark(
                    "WARN",
                    "NSIS not found (optional unless building installer)",
                );
            }
        }
        if which::which("powershell.exe").is_ok() {
            let pw_cmd = r#"
            $c = Get-ChildItem "HKLM:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients" -ErrorAction SilentlyContinue | ForEach-Object { $_ | Get-ItemProperty } | Where-Object { $_.name -like "*WebView2*" -or $_.name -like "*Edge WebView2*" } | Select-Object -First 1 -ExpandProperty name; if ($c) { Write-Output $c }
            "#;
            let (c, name) = run("powershell.exe", &["-NoProfile", "-Command", pw_cmd])?;
            if c == 0 && !name.trim().is_empty() {
                mark(
                    "OK",
                    &format!("WebView2 Runtime detected ({})", name.trim()),
                );
            } else {
                mark(
                    "WARN",
                    "WebView2 Runtime not detected (bootstrapper Tauri will install if needed)",
                );
            }
        }
    }

    println!(
        "\n[doctor] Summary: {} ok, {} warn, {} fail",
        ok, warn, fail
    );
    if fail > 0 {
        return Err(anyhow!("doctor: some checks failed"));
    }
    Ok(())
}

fn npm_run(script: &str, extra: &[&str]) -> Result<()> {
    let status = Command::new("npm")
        .arg("run")
        .arg(script)
        .args(extra)
        .status()
        .with_context(|| format!("npm run {} failed", script))?;
    if !status.success() {
        return Err(anyhow!("npm script '{}' failed", script));
    }
    Ok(())
}

fn build(target: BuildTarget) -> Result<()> {
    ensure_cli()?;
    match target {
        BuildTarget::Web => npm_run("build", &[]),
        BuildTarget::Linux => npm_run("tauri:build:linux", &[]),
        BuildTarget::Appimage => npm_run("tauri:build:appimage", &[]),
        BuildTarget::Deb => npm_run("tauri:build:deb", &[]),
        BuildTarget::WinExe => npm_run("cross:build:win:exe", &[]),
        BuildTarget::WinNsis => npm_run("cross:build:win:nsis", &[]),
        BuildTarget::WinZip => npm_run("cross:build:win:zip", &[]),
    }
}

fn prep(target: PrepTarget) -> Result<()> {
    match target {
        PrepTarget::Win => npm_run("cross:prep:win", &[]),
    }
}

fn fmt_cmd(which: FmtWhich) -> Result<()> {
    match which {
        FmtWhich::All => npm_run("fmt", &[]),
        FmtWhich::Js => npm_run("fmt:js", &[]),
        FmtWhich::Rust => npm_run("fmt:rust", &[]),
    }
}

fn lint_cmd(fix: bool) -> Result<()> {
    if fix {
        npm_run("lint:fix", &[])
    } else {
        npm_run("lint", &[])
    }
}

fn check_cmd() -> Result<()> {
    // JS lint + Rust clippy
    npm_run("lint", &[])?;
    // clippy with -D warnings
    let status = Command::new("cargo")
        .args([
            "clippy",
            "--manifest-path",
            "src-tauri/Cargo.toml",
            "--",
            "-D",
            "warnings",
        ])
        .status()
        .context("cargo clippy failed")?;
    if !status.success() {
        return Err(anyhow!("clippy failed"));
    }
    println!("✓ check: lint JS/TS + Clippy OK");
    Ok(())
}

fn check_cmd_parallel() -> Result<()> {
    // Run ESLint and Clippy concurrently and aggregate results.
    println!("[check-par] Running ESLint and Clippy in parallel…");
    let t0 = Instant::now();

    let eslint = thread::spawn(|| -> Result<(String, bool, String)> {
        let (code, out) = run("npm", &["run", "lint"])?;
        Ok((String::from("eslint"), code == 0, out))
    });

    let clippy = thread::spawn(|| -> Result<(String, bool, String)> {
        let (code, out) = run(
            "cargo",
            &[
                "clippy",
                "--manifest-path",
                "src-tauri/Cargo.toml",
                "--",
                "-D",
                "warnings",
            ],
        )?;
        Ok((String::from("clippy"), code == 0, out))
    });

    let mut ok = 0usize;
    let mut fail = 0usize;
    for res in [eslint.join(), clippy.join()] {
        match res {
            Ok(Ok((name, success, out))) => {
                if success {
                    ok += 1;
                    println!("[ OK ] {}", name);
                } else {
                    fail += 1;
                    println!("[FAIL] {}", name);
                }
                if !out.trim().is_empty() {
                    println!("{}", out.trim());
                }
            }
            Ok(Err(e)) => {
                fail += 1;
                println!("[FAIL] task error: {}", e);
            }
            Err(_) => {
                fail += 1;
                println!("[FAIL] thread panicked");
            }
        }
    }

    let dt = t0.elapsed();
    println!(
        "[check-par] Summary: {} ok, {} fail ({}.{:03}s)",
        ok,
        fail,
        dt.as_secs(),
        dt.subsec_millis()
    );
    if fail > 0 {
        return Err(anyhow!("check-par: some checks failed"));
    }
    Ok(())
}

fn ci_checks_cmd() -> Result<()> {
    // Collect optional changes-only file lists from env
    let changed_js: Vec<String> = env::var("CHANGED_JS")
        .unwrap_or_default()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    let changed_fmt: Vec<String> = env::var("CHANGED_FMT")
        .unwrap_or_default()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    let changed_rust: Vec<String> = env::var("CHANGED_RUST")
        .unwrap_or_default()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();

    // ESLint (changes-only if provided)
    if changed_js.is_empty() {
        npm_run("lint", &[])?;
    } else {
        let args = vec![
            "--no-install",
            "eslint",
            "--cache",
            "--cache-location",
            ".cache/eslint",
            "--max-warnings",
            "0",
        ]; // no default path; we pass files
        let arg_refs: Vec<&str> = args
            .iter()
            .copied()
            .chain(changed_js.iter().map(|s| s.as_str()))
            .collect();
        let (code, _out) = run("npx", &arg_refs)?;
        if code != 0 {
            return Err(anyhow!("eslint failed (changes-only)"));
        }
    }
    // tsc --noEmit with incremental cache
    let (code, _out) = run(
        "npx",
        &[
            "--no-install",
            "tsc",
            "--noEmit",
            "--incremental",
            "--tsBuildInfoFile",
            "./dist/.tsbuildinfo",
        ],
    )?;
    if code != 0 {
        return Err(anyhow!("tsc --noEmit failed"));
    }
    // Prettier --check (changes-only if provided)
    if changed_fmt.is_empty() {
        let (code2, _out2) = run(
            "npx",
            &["--no-install", "prettier", "--cache", "--check", "."],
        )?;
        if code2 != 0 {
            return Err(anyhow!("prettier --check failed"));
        }
    } else {
        let args = vec!["--no-install", "prettier", "--cache", "--check"];
        let arg_refs: Vec<&str> = args
            .iter()
            .copied()
            .chain(changed_fmt.iter().map(|s| s.as_str()))
            .collect();
        let (code2, _out2) = run("npx", &arg_refs)?;
        if code2 != 0 {
            return Err(anyhow!("prettier --check failed (changes-only)"));
        }
    }
    // Clippy
    let status = Command::new("cargo")
        .args([
            "clippy",
            "--manifest-path",
            "src-tauri/Cargo.toml",
            "--",
            "-D",
            "warnings",
        ])
        .status()
        .context("cargo clippy failed")?;
    if !status.success() {
        return Err(anyhow!("clippy failed"));
    }
    // rustfmt --check (changes-only if provided)
    if changed_rust.is_empty() {
        let status2 = Command::new("cargo")
            .args([
                "fmt",
                "--manifest-path",
                "src-tauri/Cargo.toml",
                "--",
                "--check",
            ])
            .status()
            .context("cargo fmt --check failed")?;
        if !status2.success() {
            return Err(anyhow!("rustfmt --check failed"));
        }
    } else {
        let mut args: Vec<&str> = vec!["--check"];
        let files: Vec<&str> = changed_rust.iter().map(|s| s.as_str()).collect();
        args.extend(files);
        let (code3, _out3) = run("rustfmt", &args)?;
        if code3 != 0 {
            return Err(anyhow!("rustfmt --check failed (changes-only)"));
        }
    }
    println!("✓ ci-checks: ESLint + tsc --noEmit + Prettier --check + Clippy + rustfmt --check OK");
    Ok(())
}

fn ci_checks_cmd_parallel() -> Result<()> {
    // Run ESLint, tsc --noEmit, Prettier --check, Clippy and rustfmt --check concurrently.
    println!("[ci-checks-par] Running checks in parallel…");
    let t0 = Instant::now();

    // Collect optional changes-only file lists from env
    let changed_js: Vec<String> = env::var("CHANGED_JS")
        .unwrap_or_default()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    let changed_fmt: Vec<String> = env::var("CHANGED_FMT")
        .unwrap_or_default()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    let changed_rust: Vec<String> = env::var("CHANGED_RUST")
        .unwrap_or_default()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();

    let mut tasks: Vec<(String, String, Vec<String>)> = vec![];

    // ESLint
    if changed_js.is_empty() {
        tasks.push((
            "eslint".into(),
            "npm".into(),
            vec!["run".into(), "lint".into()],
        ));
    } else {
        let mut a = vec![
            "--no-install".into(),
            "eslint".into(),
            "--cache".into(),
            "--cache-location".into(),
            ".cache/eslint".into(),
            "--max-warnings".into(),
            "0".into(),
        ];
        a.extend(changed_js.clone());
        tasks.push(("eslint".into(), "npx".into(), a));
    }

    // tsc (global, incremental)
    tasks.push((
        "tsc".into(),
        "npx".into(),
        vec![
            "--no-install".into(),
            "tsc".into(),
            "--noEmit".into(),
            "--incremental".into(),
            "--tsBuildInfoFile".into(),
            "./dist/.tsbuildinfo".into(),
        ],
    ));

    // Prettier --check
    if changed_fmt.is_empty() {
        tasks.push((
            "prettier".into(),
            "npx".into(),
            vec![
                "--no-install".into(),
                "prettier".into(),
                "--cache".into(),
                "--check".into(),
                ".".into(),
            ],
        ));
    } else {
        let mut a = vec![
            "--no-install".into(),
            "prettier".into(),
            "--cache".into(),
            "--check".into(),
        ];
        a.extend(changed_fmt.clone());
        tasks.push(("prettier".into(), "npx".into(), a));
    }

    // Clippy
    tasks.push((
        "clippy".into(),
        "cargo".into(),
        vec![
            "clippy".into(),
            "--manifest-path".into(),
            "src-tauri/Cargo.toml".into(),
            "--".into(),
            "-D".into(),
            "warnings".into(),
        ],
    ));

    // rustfmt --check (changes-only if provided)
    if changed_rust.is_empty() {
        tasks.push((
            "rustfmt".into(),
            "cargo".into(),
            vec![
                "fmt".into(),
                "--manifest-path".into(),
                "src-tauri/Cargo.toml".into(),
                "--".into(),
                "--check".into(),
            ],
        ));
    } else {
        let mut a = vec!["--check".into()];
        a.extend(changed_rust.clone());
        tasks.push(("rustfmt".into(), "rustfmt".into(), a));
    }

    let mut handles = Vec::with_capacity(tasks.len());
    for (name, cmd, args_v) in tasks {
        let name_s = name;
        let cmd_s = cmd;
        handles.push(thread::spawn(move || -> Result<(String, bool, String)> {
            let args_ref: Vec<&str> = args_v.iter().map(|s| s.as_str()).collect();
            let (code, out) = run(&cmd_s, &args_ref)?;
            Ok((name_s, code == 0, out))
        }));
    }

    let mut ok = 0usize;
    let mut fail = 0usize;
    for h in handles {
        match h.join() {
            Ok(Ok((name, success, out))) => {
                if success {
                    ok += 1;
                    println!("[ OK ] {}", name);
                } else {
                    fail += 1;
                    println!("[FAIL] {}", name);
                }
                if !out.trim().is_empty() {
                    println!("{}", out.trim());
                }
            }
            Ok(Err(e)) => {
                fail += 1;
                println!("[FAIL] task error: {}", e);
            }
            Err(_) => {
                fail += 1;
                println!("[FAIL] thread panicked");
            }
        }
    }

    let dt = t0.elapsed();
    println!(
        "[ci-checks-par] Summary: {} ok, {} fail ({}.{:03}s)",
        ok,
        fail,
        dt.as_secs(),
        dt.subsec_millis()
    );
    if fail > 0 {
        return Err(anyhow!("ci-checks-par: some checks failed"));
    }
    Ok(())
}

fn fix_cmd() -> Result<()> {
    npm_run("fmt", &[])?;
    npm_run("lint:fix", &[])
}

fn clean_cmd() -> Result<()> {
    // Remove dist and src-tauri/target
    let paths = ["dist", "src-tauri/target"];
    for p in paths {
        let _ = std::fs::remove_dir_all(p);
    }
    Ok(())
}

fn release_cmd(action: ReleaseAction) -> Result<()> {
    match action {
        ReleaseAction::Tag { version } => {
            let ver = version
                .or_else(|| env::var("VERSION").ok())
                .ok_or_else(|| anyhow!("Set VERSION or pass -- version"))?;
            npm_run("release:tag", &["--", &ver])
        }
        ReleaseAction::Gh { version, notes } => {
            let ver = version
                .or_else(|| env::var("VERSION").ok())
                .ok_or_else(|| anyhow!("Set VERSION or pass -- version"))?;
            let nts = notes
                .or_else(|| env::var("NOTES").ok())
                .unwrap_or_else(|| String::from("Release draft"));
            npm_run("release:gh", &["--", &ver, &nts])
        }
    }
}

fn npm_ci() -> Result<()> {
    let mut cmd = Command::new("npm");
    cmd.arg("ci");
    cmd.env("NPM_CONFIG_PRODUCTION", "false");
    let st = cmd.status().context("npm ci failed")?;
    if !st.success() {
        // explicit fallback, just in case
        let mut inst = Command::new("npm");
        inst.arg("install");
        inst.env("NPM_CONFIG_PRODUCTION", "false");
        let st2 = inst.status().context("npm install failed")?;
        if !st2.success() {
            return Err(anyhow!("npm install failed"));
        }
    }
    Ok(())
}

fn setup_cmd(xtask_release: bool) -> Result<()> {
    println!("[setup] Installing npm dependencies (npm ci)…");
    npm_ci()?;
    if xtask_release {
        println!("[setup] Building xtask in release…");
        let st = Command::new("cargo")
            .args(["build", "--manifest-path", "xtask/Cargo.toml", "--release"])
            .status()
            .context("cargo build (xtask --release) failed")?;
        if !st.success() {
            return Err(anyhow!("xtask release build failed"));
        }
    }
    println!("[setup] Done.");
    Ok(())
}

fn ts_check_cmd() -> Result<()> {
    let (code, _out) = run(
        "npx",
        &[
            "--no-install",
            "tsc",
            "--noEmit",
            "--incremental",
            "--tsBuildInfoFile",
            "./dist/.tsbuildinfo",
        ],
    )?;
    if code != 0 {
        return Err(anyhow!("tsc --noEmit failed"));
    }
    Ok(())
}

fn fmt_check_cmd(which: FmtWhich) -> Result<()> {
    match which {
        FmtWhich::Js => {
            let (code, _out) = run(
                "npx",
                &["--no-install", "prettier", "--cache", "--check", "."],
            )?;
            if code != 0 {
                return Err(anyhow!("prettier --check failed"));
            }
            Ok(())
        }
        FmtWhich::Rust => {
            let status = Command::new("cargo")
                .args([
                    "fmt",
                    "--manifest-path",
                    "src-tauri/Cargo.toml",
                    "--",
                    "--check",
                ])
                .status()
                .context("cargo fmt --check failed")?;
            if !status.success() {
                return Err(anyhow!("rustfmt --check failed"));
            }
            Ok(())
        }
        FmtWhich::All => {
            fmt_check_cmd(FmtWhich::Js)?;
            fmt_check_cmd(FmtWhich::Rust)
        }
    }
}

fn clippy_cmd() -> Result<()> {
    let status = Command::new("cargo")
        .args([
            "clippy",
            "--manifest-path",
            "src-tauri/Cargo.toml",
            "--",
            "-D",
            "warnings",
        ])
        .status()
        .context("cargo clippy failed")?;
    if !status.success() {
        return Err(anyhow!("clippy failed"));
    }
    Ok(())
}

fn bench_once<F: FnOnce() -> Result<()>>(label: &str, f: F) -> Result<std::time::Duration> {
    println!("[bench] {}", label);
    let t0 = Instant::now();
    f()?;
    Ok(t0.elapsed())
}

fn bench_warm_then_time<F: FnOnce() -> Result<()>, G: FnOnce() -> Result<()>>(
    warm_label: &str,
    time_label: &str,
    warm: F,
    timed: G,
) -> Result<std::time::Duration> {
    // Warm
    let _ = bench_once(warm_label, warm);
    // Timed
    bench_once(time_label, timed)
}

fn bench_cmd() -> Result<()> {
    println!("[bench] Measuring sequential vs parallel checks (report 2nd run)");

    // Simple check (eslint + clippy)
    let t_seq = bench_warm_then_time("check (warm)", "check (timed)", check_cmd, check_cmd)?;
    let t_par = bench_warm_then_time(
        "check-par (warm)",
        "check-par (timed)",
        check_cmd_parallel,
        check_cmd_parallel,
    )?;
    println!(
        "[bench] check: seq={}.{:03}s | par={} .{:03}s | speedup x{:.2}",
        t_seq.as_secs(),
        t_seq.subsec_millis(),
        t_par.as_secs(),
        t_par.subsec_millis(),
        (t_seq.as_secs_f64() / t_par.as_secs_f64()).max(0.0)
    );

    // CI checks
    let t_seq_ci = bench_warm_then_time(
        "ci-checks (warm)",
        "ci-checks (timed)",
        ci_checks_cmd,
        ci_checks_cmd,
    )?;
    let t_par_ci = bench_warm_then_time(
        "ci-checks-par (warm)",
        "ci-checks-par (timed)",
        ci_checks_cmd_parallel,
        ci_checks_cmd_parallel,
    )?;
    println!(
        "[bench] ci-checks: seq={} .{:03}s | par={} .{:03}s | speedup x{:.2}",
        t_seq_ci.as_secs(),
        t_seq_ci.subsec_millis(),
        t_par_ci.as_secs(),
        t_par_ci.subsec_millis(),
        (t_seq_ci.as_secs_f64() / t_par_ci.as_secs_f64()).max(0.0)
    );

    Ok(())
}
