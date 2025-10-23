import { NextResponse } from "next/server";
import { UrlMetadata } from "@/types/savings-goals";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract metadata from HTML
    const metadata: UrlMetadata = {
      title: "",
      description: "",
      price: undefined,
      image: "",
      currency: "EUR",
    };

    // Extract title - try multiple patterns
    const titlePatterns = [
      /<h1[^>]*class="ListingHeader-title"[^>]*>([^<]+)<\/h1>/i, // Marktplaats
      /<meta property="og:title" content="([^"]+)"/i, // OpenGraph
      /<title>([^<]+)<\/title>/i, // Regular title tag
    ];

    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match) {
        metadata.title = match[1].trim();
        break;
      }
    }
    if (!metadata.title) metadata.title = "Onbekend product";

    // Extract description - try multiple patterns
    // First try to get the full description div content
    const descDivMatch = html.match(
      /<div[^>]*class="Description-description"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id="description-button-root"/i
    );

    if (descDivMatch) {
      // Extract text from data-collapsable div
      const collapsableMatch = descDivMatch[1].match(
        /<div[^>]*data-collapsable="description"[^>]*>([\s\S]*?)<\/div>/i
      );
      if (collapsableMatch) {
        metadata.description = collapsableMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\n\n+/g, "\n\n")
          .trim();
      }
    }

    // Fallback to meta tags if no description found
    if (!metadata.description) {
      const ogDesc = html.match(
        /<meta property="og:description" content="([^"]+)"/i
      );
      const metaDesc = html.match(
        /<meta name="description" content="([^"]+)"/i
      );
      metadata.description = ogDesc?.[1] || metaDesc?.[1] || "";
    }

    // Extract all images from thumbnails and carousel
    const imageUrls: string[] = [];

    // Extract from thumbnail spans (background-image style)
    const thumbnailMatches = html.matchAll(
      /style="background-image:url\(&quot;([^&]+)&quot;\)"/gi
    );
    for (const match of thumbnailMatches) {
      let imageUrl = match[1];
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      }
      // Convert thumbnail to full size (change rule parameter)
      imageUrl = imageUrl.replace(
        /rule=ecg_mp_eps\$_82/,
        "rule=ecg_mp_eps$_85"
      );
      if (!imageUrls.includes(imageUrl)) {
        imageUrls.push(imageUrl);
      }
    }

    // Extract from img tags
    const imgMatches = html.matchAll(
      /<img[^>]*class="Carousel-image"[^>]*src="([^"]+)"/gi
    );
    for (const match of imgMatches) {
      let imageUrl = match[1];
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      }
      if (!imageUrls.includes(imageUrl)) {
        imageUrls.push(imageUrl);
      }
    }

    // Fallback to meta tags if no images found
    if (imageUrls.length === 0) {
      const ogImage = html.match(
        /<meta property="og:image" content="([^"]+)"/i
      );
      const twitterImage = html.match(
        /<meta name="twitter:image" content="([^"]+)"/i
      );
      const fallbackImage = ogImage?.[1] || twitterImage?.[1];
      if (fallbackImage) {
        imageUrls.push(fallbackImage);
      }
    }

    metadata.images = imageUrls;
    metadata.image = imageUrls[0] || "";

    // Extract price - try various patterns
    // Replace &nbsp; with regular space first
    const normalizedHtml = html.replace(/&nbsp;/g, " ");

    const pricePatterns = [
      /<div[^>]*class="ListingHeader-price"[^>]*>€\s*([0-9]+(?:[.,][0-9]{3})*[.,][0-9]{2})/i, // Marktplaats header price
      /€\s*([0-9]+(?:[.,][0-9]{3})*[.,][0-9]{2})/i, // € 1.234,56 or € 123,45
      /EUR\s*([0-9]+[.,][0-9]{2})/i, // EUR 123.45
      /"price"[:\s]*"?([0-9]+[.,][0-9]{2})"?/i, // JSON price field
      /<meta property="product:price:amount" content="([^"]+)"/i, // OpenGraph
      /data-price="([0-9]+[.,][0-9]{2})"/i, // data-price attribute
    ];

    for (const pattern of pricePatterns) {
      const match = normalizedHtml.match(pattern);
      if (match) {
        // Handle both EU (1.234,56) and US (1,234.56) formats
        let priceStr = match[1];
        // If it has both comma and dot, determine which is decimal separator
        if (priceStr.includes(",") && priceStr.includes(".")) {
          // EU format: 1.234,56
          priceStr = priceStr.replace(/\./g, "").replace(",", ".");
        } else if (priceStr.includes(",")) {
          // Just comma: could be EU decimal or US thousands
          // Check if it's EU decimal (has cents after comma)
          if (/,\d{2}$/.test(priceStr)) {
            priceStr = priceStr.replace(",", ".");
          } else {
            // US thousands separator
            priceStr = priceStr.replace(/,/g, "");
          }
        }
        metadata.price = parseFloat(priceStr);
        break;
      }
    }

    // Check for currency
    if (html.includes("£") || html.includes("GBP")) {
      metadata.currency = "GBP";
    } else if (html.includes("$") || html.includes("USD")) {
      metadata.currency = "USD";
    }

    // Log extraction results for debugging
    console.log("Extracted metadata:", {
      title: metadata.title ? "✓" : "✗",
      description: metadata.description
        ? `✓ (${metadata.description.length} chars)`
        : "✗",
      price: metadata.price ? `✓ (€${metadata.price})` : "✗",
      images: metadata.images ? `✓ (${metadata.images.length} images)` : "✗",
    });

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return NextResponse.json(
      { error: "Failed to extract metadata" },
      { status: 500 }
    );
  }
}
