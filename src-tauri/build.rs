use std::{fs, fs::File, io::BufWriter, path::Path};

fn ensure_icon() {
    let dir = Path::new("icons");
    let path = dir.join("icon.png");
    if let Ok(meta) = fs::metadata(&path) {
        // Si une icône personnalisée (probablement >1KB) existe, ne pas écraser
        if meta.len() > 1024 {
            return;
        }
    }
    let _ = fs::create_dir_all(dir);
    // Génère une icône PNG RGBA 64x64 transparente pour satisfaire Tauri
    if let Ok(file) = File::create(&path) {
        let w = BufWriter::new(file);
        let mut encoder = png::Encoder::new(w, 64, 64);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        if let Ok(mut writer) = encoder.write_header() {
            let data = vec![0u8; 64 * 64 * 4];
            let _ = writer.write_image_data(&data);
        }
    }
}

fn main() {
    ensure_icon();
    tauri_build::build();
}
