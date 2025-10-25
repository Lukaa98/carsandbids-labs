import React from "react";
import { Card, CardMedia, CardContent, Typography, Box } from "@mui/material";

export default function AuctionCard({ auction }) {
    return (
        <Card
            sx={{
                maxWidth: 345,
                borderRadius: 3,
                boxShadow: 3,
                transition: "0.3s",
                "&:hover": { boxShadow: 6, transform: "scale(1.02)" },
            }}
        >
            <CardMedia
                component="img"
                height="200"
                image={auction.mainImageUrl}
                alt={auction.title}
            />
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                    {auction.year} {auction.make} {auction.model}
                </Typography>

                <Typography variant="body2" color="text.secondary" noWrap>
                    {auction.location}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1 }}>
                    {auction.engine} · {auction.drivetrain}
                </Typography>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Sale Type: {auction.saleType}</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {auction.finalSalePrice
                            ? `$${auction.finalSalePrice.toLocaleString()}`
                            : "—"}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}
