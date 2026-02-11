import Foundation
import PDFKit
import AppKit

let inputPath = "/Users/alexpotter/Documents/New project/output/pdf/vision_contract_audit_checklist.pdf"
let outputPath = "/Users/alexpotter/Documents/New project/output/pdf/vision_contract_audit_checklist_flat.pdf"

let rasterizePageIndexes: Set<Int> = [0, 7] // 0-based: title page and last page
let scale: CGFloat = 3.0

let inputURL = URL(fileURLWithPath: inputPath)
guard let doc = PDFDocument(url: inputURL) else {
    fputs("Failed to open input PDF at \(inputPath)\n", stderr)
    exit(1)
}

let outputURL = URL(fileURLWithPath: outputPath)
try? FileManager.default.removeItem(at: outputURL)

var firstPageBox = CGRect(x: 0, y: 0, width: 612, height: 792)
guard let consumer = CGDataConsumer(url: outputURL as CFURL),
      let outCtx = CGContext(consumer: consumer, mediaBox: &firstPageBox, nil)
else {
    fputs("Failed to create output PDF context at \(outputPath)\n", stderr)
    exit(1)
}

func rasterize(page: PDFPage, bounds: CGRect) -> CGImage? {
    let pixelWidth = max(1, Int(bounds.width * scale))
    let pixelHeight = max(1, Int(bounds.height * scale))
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

    guard let bmp = CGContext(
        data: nil,
        width: pixelWidth,
        height: pixelHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: bitmapInfo
    ) else { return nil }

    bmp.interpolationQuality = .high
    bmp.setFillColor(NSColor.white.cgColor)
    bmp.fill(CGRect(x: 0, y: 0, width: CGFloat(pixelWidth), height: CGFloat(pixelHeight)))

    bmp.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: bmp)
    return bmp.makeImage()
}

for pageIndex in 0..<doc.pageCount {
    guard let page = doc.page(at: pageIndex) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    let pageInfo: [CFString: Any] = [kCGPDFContextMediaBox: bounds]
    outCtx.beginPDFPage(pageInfo as CFDictionary)

    if rasterizePageIndexes.contains(pageIndex), let image = rasterize(page: page, bounds: bounds) {
        outCtx.draw(image, in: CGRect(x: 0, y: 0, width: bounds.width, height: bounds.height))
    } else {
        page.draw(with: .mediaBox, to: outCtx)
    }

    outCtx.endPDFPage()
}

outCtx.closePDF()
print("Wrote flattened PDF to \(outputPath)")
