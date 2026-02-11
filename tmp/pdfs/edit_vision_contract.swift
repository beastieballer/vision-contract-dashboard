import Foundation
import PDFKit
import AppKit

struct Overlay {
    let pageIndex: Int
    let clearRect: CGRect
    let textRect: CGRect
    let text: String
    let font: NSFont
    let color: NSColor
    let alignment: NSTextAlignment
}

func centeredParagraphStyle(_ alignment: NSTextAlignment) -> NSParagraphStyle {
    let style = NSMutableParagraphStyle()
    style.alignment = alignment
    style.lineBreakMode = .byClipping
    return style
}

func drawOverlay(_ overlay: Overlay, in context: CGContext) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)

    overlay.color.setFill()
    // Fill happens below with attributes; clearRect uses white fill.
    NSColor.white.setFill()
    NSBezierPath(rect: overlay.clearRect).fill()

    let attrs: [NSAttributedString.Key: Any] = [
        .font: overlay.font,
        .foregroundColor: overlay.color,
        .paragraphStyle: centeredParagraphStyle(overlay.alignment),
    ]
    NSAttributedString(string: overlay.text, attributes: attrs).draw(in: overlay.textRect)

    NSGraphicsContext.restoreGraphicsState()
}

let inputPath = "/Users/alexpotter/Documents/vision_glass_audit_checklist (2).pdf"
let outputPath = "/Users/alexpotter/Documents/New project/output/pdf/vision_contract_audit_checklist.pdf"

let newTitle = "Vision Contract Company audit"
let newSubtitle = "Forecast Ai Consulting Assesment"
let replacementCompany = "Vision Contract"

let inputURL = URL(fileURLWithPath: inputPath)
guard let doc = PDFDocument(url: inputURL) else {
    fputs("Failed to open input PDF at \(inputPath)\n", stderr)
    exit(1)
}

let outputURL = URL(fileURLWithPath: outputPath)
try? FileManager.default.removeItem(at: outputURL)

var firstPageBox = CGRect(x: 0, y: 0, width: 612, height: 792)
guard let consumer = CGDataConsumer(url: outputURL as CFURL),
      let ctx = CGContext(consumer: consumer, mediaBox: &firstPageBox, nil)
else {
    fputs("Failed to create output PDF context at \(outputPath)\n", stderr)
    exit(1)
}

let titleSelections = doc.findString("Vision Glass Company Audit", withOptions: .caseInsensitive)
let assessmentSelections = doc.findString("AI Consulting Assessment", withOptions: .caseInsensitive)
let mdSelections = doc.findString("MD", withOptions: .caseInsensitive)

var overlaysByPage: [Int: [Overlay]] = [:]

if let titleSel = titleSelections.first,
   doc.pageCount > 0,
   let page0 = doc.page(at: 0)
{
    let pageBounds = page0.bounds(for: .mediaBox)
    let titleBounds = titleSel.bounds(for: page0)

    // Cover the whole title line and redraw centered.
    let clear = CGRect(x: 0, y: titleBounds.minY - 2, width: pageBounds.width, height: titleBounds.height + 4)
    let text = CGRect(x: 0, y: titleBounds.minY - 1, width: pageBounds.width, height: titleBounds.height + 2)

    let titleOverlay = Overlay(
        pageIndex: 0,
        clearRect: clear,
        textRect: text,
        text: newTitle,
        font: NSFont.systemFont(ofSize: 24, weight: .semibold),
        color: NSColor(srgbRed: 0.20, green: 0.25, blue: 0.35, alpha: 1.0),
        alignment: .center
    )
    overlaysByPage[0, default: []].append(titleOverlay)
}

if let assessSel = assessmentSelections.first,
   let mdSel = mdSelections.first,
   doc.pageCount > 0,
   let page0 = doc.page(at: 0)
{
    let pageBounds = page0.bounds(for: .mediaBox)
    let assessBounds = assessSel.bounds(for: page0)
    let mdBounds = mdSel.bounds(for: page0)
    let union = assessBounds.union(mdBounds)

    let clear = CGRect(x: 0, y: union.minY - 2, width: pageBounds.width, height: union.height + 4)
    let text = CGRect(x: 0, y: union.minY - 1, width: pageBounds.width, height: union.height + 2)

    let subtitleOverlay = Overlay(
        pageIndex: 0,
        clearRect: clear,
        textRect: text,
        text: newSubtitle,
        font: NSFont.systemFont(ofSize: 10, weight: .regular),
        color: NSColor(srgbRed: 0.55, green: 0.55, blue: 0.55, alpha: 1.0),
        alignment: .center
    )
    overlaysByPage[0, default: []].append(subtitleOverlay)
}

// Replace any other "Vision Glass" occurrences throughout the PDF with "Vision Contract".
let companySelections = doc.findString("Vision Glass", withOptions: .caseInsensitive)
for sel in companySelections {
    guard let page = sel.pages.first else { continue }
    let pageIndex = doc.index(for: page)
    if pageIndex < 0 { continue }
    let b = sel.bounds(for: page)

    // Skip page 1 title area we already redraw (still OK, but avoid double overlays).
    if pageIndex == 0 { continue }

    let clear = CGRect(x: max(0, b.minX - 2), y: max(0, b.minY - 2), width: b.width + 120, height: b.height + 4)
    let text = CGRect(x: max(0, b.minX - 1), y: max(0, b.minY - 1), width: b.width + 120, height: b.height + 2)

    let overlay = Overlay(
        pageIndex: pageIndex,
        clearRect: clear,
        textRect: text,
        text: replacementCompany,
        font: NSFont.systemFont(ofSize: max(8, b.height), weight: .regular),
        color: NSColor.black,
        alignment: .left
    )
    overlaysByPage[pageIndex, default: []].append(overlay)
}

for pageIndex in 0..<doc.pageCount {
    guard let page = doc.page(at: pageIndex) else { continue }
    let bounds = page.bounds(for: .mediaBox)

    let pageInfo: [CFString: Any] = [kCGPDFContextMediaBox: bounds]
    ctx.beginPDFPage(pageInfo as CFDictionary)

    page.draw(with: .mediaBox, to: ctx)

    if let overlays = overlaysByPage[pageIndex] {
        for overlay in overlays {
            drawOverlay(overlay, in: ctx)
        }
    }

    ctx.endPDFPage()
}

ctx.closePDF()
print("Wrote updated PDF to \(outputPath)")
