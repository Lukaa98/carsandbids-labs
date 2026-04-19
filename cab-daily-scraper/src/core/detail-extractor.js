export async function enrichOne(browser, url) {
  const page = await browser.newPage();

  try {
    console.log(`\n============================`);
    console.log(`🔍 Enriching: ${url}`);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const auctionId = url.split("/auctions/")[1]?.split("/")[0];

    // 🥇 Try NEXT_DATA first
    const nextData = await page.evaluate(() => {
      const el = document.querySelector("#__NEXT_DATA__");
      return el ? JSON.parse(el.innerText) : null;
    });

    const pageMedia = await page.evaluate(() => {
      const ogImage =
        document.querySelector('meta[property="og:image"]')?.content ||
        document.querySelector('meta[name="og:image"]')?.content ||
        null;

      const imageUrls = Array.from(document.images)
        .map((img) => img.currentSrc || img.src || null)
        .filter(Boolean)
        .filter((src) => /^https?:\/\//i.test(src));

      const mainImageUrl =
        ogImage ||
        imageUrls.find((src) => /carsandbids/i.test(src)) ||
        imageUrls[0] ||
        null;

      const imageCount = new Set(imageUrls).size || null;

      return { mainImageUrl, imageCount };
    });

    const auction =
      nextData?.props?.pageProps?.auction ||
      nextData?.props?.pageProps?.listing ||
      null;

    if (auction) {
      console.log("✅ Using NEXT_DATA extraction");

      return {
        auctionId,
        url,
        title: auction.title || null,
        status: {
          saleType: auction.salePrice ? "Sold" : "Bid to",
          finalSalePrice: auction.salePrice || null,
          finalBidPrice: auction.salePrice || null,
          currency: "USD",
        },
        vehicle: {
          year: auction.year || null,
          make: auction.make || null,
          model: auction.model || null,
          body: {
            style: auction.bodyStyle || null,
          },
          specs: {
            engine: auction.engine || null,
            transmission: auction.transmission || null,
            drivetrain: auction.drivetrain || null,
          },
          mileage: {
            value: auction.mileage || null,
            unit: "miles",
          },
          vin: auction.vin || null,
        },
        seller: {
          type: auction.sellerType || null,
          location: auction.location || null,
        },
        media: {
          mainImageUrl: pageMedia.mainImageUrl,
          imageCount: pageMedia.imageCount,
        },
        metadata: {
          scrapedAt: new Date().toISOString(),
          source: "CarsAndBids",
        },
      };
    }

    // 🟡 FALLBACK - DOM parsing (robust)
    console.log("⚠️ Falling back to DOM parsing");

    const rawData = await page.evaluate(() => {
      const text = document.body.innerText;

      const extract = (label) => {
        const regex = new RegExp(label + "\\n(.+)");
        const match = text.match(regex);
        return match ? match[1].trim() : null;
      };

      // 🔥 FIXED PRICE EXTRACTION
      let price = null;
      let saleType = "Bid to";

      const nodes = Array.from(document.querySelectorAll("*"));

      for (const el of nodes) {
        const txt = el.innerText?.trim();
        if (!txt) continue;

        if (txt.startsWith("Sold for $")) {
          const match = txt.match(/\$([\d,]+)/);
          if (match) {
            price = Number(match[1].replace(/,/g, ""));
            saleType = "Sold";
            break;
          }
        }

        if (txt.startsWith("Bid to $")) {
          const match = txt.match(/\$([\d,]+)/);
          if (match) {
            price = Number(match[1].replace(/,/g, ""));
            saleType = "Bid to";
            break;
          }
        }
      }

      return {
        title: document.querySelector("h1")?.innerText || null,
        make: extract("Make"),
        model: extract("Model"),
        engine: extract("Engine"),
        drivetrain: extract("Drivetrain"),
        mileage: extract("Mileage"),
        transmission: extract("Transmission"),
        vin: extract("VIN"),
        bodyStyle: extract("Body Style"),
        exteriorColor: extract("Exterior Color"),
        interiorColor: extract("Interior Color"),
        location: extract("Location"),
        seller: extract("Seller"),
        sellerType: extract("Seller Type"),
        price,
        saleType,
        mainImageUrl:
          document.querySelector('meta[property="og:image"]')?.content ||
          document.querySelector('meta[name="og:image"]')?.content ||
          null,
        imageCount: new Set(
          Array.from(document.images)
            .map((img) => img.currentSrc || img.src || null)
            .filter(Boolean)
            .filter((src) => /^https?:\/\//i.test(src))
        ).size || null,
      };
    });

    return {
      auctionId,
      url,
      title: rawData.title,
      status: {
        saleType: rawData.saleType,
        finalSalePrice: rawData.price,
        finalBidPrice: rawData.price,
        currency: "USD",
      },
      vehicle: {
        make: rawData.make,
        model: rawData.model,
        body: {
          style: rawData.bodyStyle,
          colorExterior: rawData.exteriorColor,
          colorInterior: rawData.interiorColor,
        },
        specs: {
          engine: rawData.engine,
          transmission: rawData.transmission,
          drivetrain: rawData.drivetrain,
        },
        mileage: {
          value: rawData.mileage
            ? parseInt(rawData.mileage.replace(/,/g, ""), 10)
            : null,
          unit: "miles",
        },
        vin: rawData.vin,
      },
      seller: {
        type: rawData.sellerType?.replace(/\(.*?\)/g, "").trim() || rawData.seller,
        location: rawData.location,
      },
      media: {
        mainImageUrl: rawData.mainImageUrl,
        imageCount: rawData.imageCount,
      },
      metadata: {
        scrapedAt: new Date().toISOString(),
        source: "CarsAndBids",
      },
    };

  } catch (e) {
    console.error(`❌ Failed to enrich ${url}:`, e.message);
    return { url, enriched: false, error: String(e) };
  } finally {
    await page.close();
  }
}
