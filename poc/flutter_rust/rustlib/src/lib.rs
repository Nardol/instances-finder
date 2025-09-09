use libc::c_char;
use once_cell::sync::Lazy;
use std::{ffi::{CStr, CString}, sync::Mutex};

static VERSION: &str = env!("CARGO_PKG_VERSION");
static STATE: Lazy<Mutex<u64>> = Lazy::new(|| Mutex::new(0));

#[no_mangle]
pub extern "C" fn greet(name: *const c_char) -> *mut c_char {
    let name = unsafe {
        if name.is_null() { CStr::from_bytes_with_nul(b"\0").unwrap() } else { CStr::from_ptr(name) }
    };
    let name = name.to_string_lossy();
    let msg = format!("Hello {name} — Instances Core v{VERSION}");
    CString::new(msg).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 { a + b }

#[no_mangle]
pub extern "C" fn tick() -> u64 {
    let mut guard = STATE.lock().unwrap();
    *guard += 1;
    *guard
}

#[no_mangle]
pub extern "C" fn free_rust_cstr(ptr: *mut c_char) {
    if ptr.is_null() { return; }
    unsafe { let _ = CString::from_raw(ptr); }
}

