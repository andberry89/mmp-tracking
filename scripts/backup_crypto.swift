import CryptoKit
import Foundation
import Security

private let serviceName = "MMPTrackingBackupEncryptionKey"
private let accountName = NSUserName()

private func fail(_ message: String, code: Int32 = 1) -> Never {
    fputs("Backup encryption: \(message)\n", stderr)
    exit(code)
}

private func keychainQuery() -> [String: Any] {
    [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: serviceName,
        kSecAttrAccount as String: accountName,
    ]
}

private func loadKey() -> SymmetricKey {
    var query = keychainQuery()
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne

    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    guard status == errSecSuccess, let data = result as? Data, data.count == 32 else {
        fail("No valid encryption key was found in your login Keychain. Run the setup script first.")
    }
    return SymmetricKey(data: data)
}

private func createKey() {
    var query = keychainQuery()
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne

    var existing: CFTypeRef?
    let lookupStatus = SecItemCopyMatching(query as CFDictionary, &existing)
    if lookupStatus == errSecSuccess {
        print("The backup encryption key is already set up in your login Keychain.")
        return
    }
    guard lookupStatus == errSecItemNotFound else {
        fail("Could not check the login Keychain (status \(lookupStatus)).")
    }

    let key = SymmetricKey(size: .bits256)
    let keyData = key.withUnsafeBytes { Data($0) }
    var item = keychainQuery()
    item[kSecValueData as String] = keyData
    item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

    let status = SecItemAdd(item as CFDictionary, nil)
    guard status == errSecSuccess else {
        fail("Could not save the encryption key to your login Keychain (status \(status)).")
    }
    print("Created a private backup encryption key in your login Keychain.")
}

private func printRecoveryKey() {
    let key = loadKey()
    let data = key.withUnsafeBytes { Data($0) }
    print(data.base64EncodedString())
}

private func encrypt(input: String, output: String) throws {
    let plaintext = try Data(contentsOf: URL(fileURLWithPath: input))
    let sealed = try AES.GCM.seal(plaintext, using: loadKey())
    guard let combined = sealed.combined else {
        fail("Could not create the encrypted backup.")
    }
    try combined.write(to: URL(fileURLWithPath: output), options: .atomic)
}

private func decrypt(input: String, output: String) throws {
    let combined = try Data(contentsOf: URL(fileURLWithPath: input))
    let sealed = try AES.GCM.SealedBox(combined: combined)
    let plaintext = try AES.GCM.open(sealed, using: loadKey())
    try plaintext.write(to: URL(fileURLWithPath: output), options: .atomic)
}

let arguments = Array(CommandLine.arguments.dropFirst())
do {
    switch arguments.first {
    case "init-key":
        createKey()
    case "print-recovery-key":
        printRecoveryKey()
    case "encrypt" where arguments.count == 3:
        try encrypt(input: arguments[1], output: arguments[2])
    case "decrypt" where arguments.count == 3:
        try decrypt(input: arguments[1], output: arguments[2])
    default:
        fail("Usage: backup_crypto.swift init-key | print-recovery-key | encrypt INPUT OUTPUT | decrypt INPUT OUTPUT")
    }
} catch {
    fail(error.localizedDescription)
}
