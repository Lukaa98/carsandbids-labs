import React from "react";
import { Card, CardMedia, CardContent, Typography, Box } from "@mui/material";

export default function AuctionCard({ auction }) {
    // Determine display label and amount
    let priceLabel = "—";
    if (auction.finalSalePrice) {
        priceLabel = `Sold for $${auction.finalSalePrice.toLocaleString()}`;
    } else if (auction.finalBidPrice) {
        priceLabel = `Bid to $${auction.finalBidPrice.toLocaleString()}`;
    }

    return (
        <Card
            sx={{
                height: 360,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: 3,
                backgroundColor: "background.paper",
                overflow: "hidden",
                transition: "0.25s ease",
                "&:hover": { boxShadow: 8, transform: "scale(1.02)" },
            }}
        >
            <CardMedia
                component="img"
                height="180"
                image={auction.mainImageUrl}
                alt={auction.title}
                sx={{ objectFit: "cover" }}
            />
            <CardContent
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "white",
                    pb: 1.5,
                }}
            >
                <Box>
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        noWrap
                        color="white"
                    >
                        {auction.year} {auction.make} {auction.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {auction.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {auction.engine} · {auction.drivetrain}
                    </Typography>
                </Box>

                <Box sx={{ mt: 1.5 }}>
                    <Typography variant="subtitle2">
                        Sale Type: {auction.saleType}
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color={
                            auction.finalSalePrice
                                ? "success.main"
                                : auction.finalBidPrice
                                    ? "warning.main"
                                    : "text.secondary"
                        }
                        sx={{ lineHeight: 1.4 }}
                    >
                        {priceLabel}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}
