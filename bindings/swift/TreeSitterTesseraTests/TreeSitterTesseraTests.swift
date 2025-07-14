import XCTest
import SwiftTreeSitter
import TreeSitterTessera

final class TreeSitterTesseraTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_tessera())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Tessera grammar")
    }
}
