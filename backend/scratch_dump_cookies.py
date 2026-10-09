"""
Export YouTube cookies from Microsoft Edge to Netscape cookies.txt format.
This script properly handles Edge's AES-256-GCM cookie encryption.

Requirements: pip install pywin32 pycryptodomex
"""

import os
import shutil
import sqlite3
import json
import base64
import struct
import sys
import subprocess

def get_edge_encryption_key():
    """Get the AES encryption key from Edge's Local State file."""
    try:
        import win32crypt
    except ImportError:
        print("ERROR: pywin32 not installed. Run: pip install pywin32")
        sys.exit(1)

    local_state_path = os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\Edge\User Data\Local State')
    if not os.path.exists(local_state_path):
        raise FileNotFoundError(f"Edge Local State not found: {local_state_path}")

    with open(local_state_path, 'r', encoding='utf-8') as f:
        local_state = json.load(f)

    encrypted_key_b64 = local_state.get('os_crypt', {}).get('encrypted_key')
    if not encrypted_key_b64:
        raise ValueError("No encrypted_key in Edge Local State")

    encrypted_key = base64.b64decode(encrypted_key_b64)
    # Remove the 'DPAPI' prefix (5 bytes)
    encrypted_key = encrypted_key[5:]
    # Decrypt using DPAPI
    decrypted_key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    return decrypted_key


def decrypt_cookie_value(encrypted_value, key):
    """Decrypt an Edge cookie value (AES-256-GCM)."""
    try:
        from Cryptodome.Cipher import AES
    except ImportError:
        try:
            from Crypto.Cipher import AES
        except ImportError:
            print("ERROR: pycryptodomex not installed. Run: pip install pycryptodomex")
            sys.exit(1)

    if not encrypted_value:
        return ''

    # Check for v10/v20 prefix (AES-GCM encrypted by Chromium)
    if encrypted_value[:3] in (b'v10', b'v20'):
        try:
            # Format: v10 + 12-byte nonce + ciphertext + 16-byte auth tag
            nonce = encrypted_value[3:15]
            ciphertext_with_tag = encrypted_value[15:]
            cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
            decrypted = cipher.decrypt_and_verify(ciphertext_with_tag[:-16], ciphertext_with_tag[-16:])
            return decrypted.decode('utf-8', errors='replace')
        except Exception as e:
            # Try without tag verification (older approach)
            try:
                cipher = AES.new(key, AES.MODE_GCM, nonce=encrypted_value[3:15])
                decrypted = cipher.decrypt(encrypted_value[15:-16])
                return decrypted.decode('utf-8', errors='replace')
            except Exception:
                return ''

    # Try DPAPI fallback for older cookie format
    try:
        import win32crypt
        value = win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1]
        return value.decode('utf-8', errors='replace')
    except Exception:
        return ''


def chromium_timestamp_to_unix(chromium_ts):
    """Convert Chromium epoch (microseconds since 1601-01-01) to Unix timestamp."""
    if not chromium_ts:
        return 0
    # Chromium epoch starts at 1601-01-01 00:00:00 UTC
    # Unix epoch starts at 1970-01-01 00:00:00 UTC
    # Difference = 11644473600 seconds
    unix_ts = (chromium_ts // 1_000_000) - 11_644_473_600
    return max(0, unix_ts)


def dump_edge_youtube_cookies(output_path='cookies.txt'):
    """Main function: extract YouTube cookies from Edge and write cookies.txt."""
    cookie_src = os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Network\Cookies')

    if not os.path.exists(cookie_src):
        print(f"ERROR: Edge cookie database not found: {cookie_src}")
        print("Make sure Microsoft Edge is installed.")
        sys.exit(1)

    # Copy the DB to avoid lock issues
    os.makedirs('tmp', exist_ok=True)
    tmp_db = os.path.join('tmp', 'edge_cookies_export.db')
    
    try:
        shutil.copy2(cookie_src, tmp_db)
    except PermissionError:
        print("ERROR: Cannot copy Edge cookie database - Edge is still running.")
        print("Please close Microsoft Edge completely and try again.")
        sys.exit(1)

    print(f"Copied Edge cookies database to: {tmp_db}")

    # Get the encryption key
    try:
        key = get_edge_encryption_key()
        print("Successfully obtained Edge encryption key.")
    except Exception as e:
        print(f"ERROR: Could not get encryption key: {e}")
        sys.exit(1)

    # Connect to the SQLite cookie database
    conn = sqlite3.connect(tmp_db)
    cursor = conn.cursor()

    # Query YouTube cookies
    cursor.execute("""
        SELECT host_key, path, is_secure, expires_utc, name, encrypted_value, is_httponly
        FROM cookies
        WHERE host_key LIKE '%youtube.com%' OR host_key LIKE '%google.com%'
        ORDER BY host_key, name
    """)
    rows = cursor.fetchall()
    conn.close()

    print(f"Found {len(rows)} YouTube/Google cookies in Edge.")

    if len(rows) == 0:
        print("WARNING: No YouTube cookies found. Make sure you are logged into YouTube in Edge.")
        print("Please:")
        print("  1. Open Microsoft Edge")
        print("  2. Go to youtube.com and log in")
        print("  3. Close Edge completely")
        print("  4. Run this script again")
        sys.exit(1)

    # Build Netscape cookies.txt
    lines = ['# Netscape HTTP Cookie File\n']
    exported_count = 0

    for host_key, path, is_secure, expires_utc, name, encrypted_value, is_httponly in rows:
        value = decrypt_cookie_value(encrypted_value, key)
        
        # Skip empty or unreadable cookie values
        if not value or not value.isprintable():
            continue

        domain_flag = "TRUE" if host_key.startswith('.') else "FALSE"
        secure_flag = "TRUE" if is_secure else "FALSE"
        httponly_flag = "#HttpOnly_" if is_httponly else ""
        expires = str(chromium_timestamp_to_unix(expires_utc))

        line = f"{httponly_flag}{host_key}\t{domain_flag}\t{path}\t{secure_flag}\t{expires}\t{name}\t{value}\n"
        lines.append(line)
        exported_count += 1

    with open(output_path, 'w', encoding='utf-8', newline='\n') as f:
        f.writelines(lines)

    print(f"\nSUCCESS! Exported {exported_count} valid cookies to: {output_path}")
    print(f"You can now restart the Maxistrong backend server.")

    # Cleanup
    try:
        os.remove(tmp_db)
    except Exception:
        pass


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Export YouTube cookies from Microsoft Edge')
    parser.add_argument('--output', default='cookies.txt', help='Output cookies.txt path (default: cookies.txt)')
    args = parser.parse_args()

    print("=" * 50)
    print(" Maxistrong - Edge Cookie Exporter")
    print("=" * 50)
    print()
    
    dump_edge_youtube_cookies(args.output)
