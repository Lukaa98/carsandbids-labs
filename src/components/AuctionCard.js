import React, { useState, useEffect } from "react";
import {
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    Divider,
    CircularProgress,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PriceYearChart from "./PriceYearChart";
import { fetchAuctions } from "../api";

export default function AuctionCard({ auction }) {
    const [open, setOpen] = useState(false);
    const [relatedAuctions, setRelatedAuctions] = useState([]);
    const [loadingChart, setLoadingChart] = useState(false);

    // Determine display label and amount
    let priceLabel = "—";
    if (auction.finalSalePrice) {
        priceLabel = `Sold for $${auction.finalSalePrice.toLocaleString()}`;
    } else if (auction.finalBidPrice) {
        priceLabel = `Bid to $${auction.finalBidPrice.toLocaleString()}`;
    }

    // 🔹 Fetch related auctions (same make/model) when dialog opens
    useEffect(() => {
        if (open) {
            (async () => {
                try {
                    setLoadingChart(true);
                    const data = await fetchAuctions({
                        page: 1,
                        limit: 100,
                        make: auction.make,
                        model: auction.model,
                    });
                    setRelatedAuctions(data.results || []);
                } catch (err) {
                    console.error("Failed to fetch related auctions:", err);
                } finally {
                    setLoadingChart(false);
                }
            })();
        }
    }, [open, auction.make, auction.model]);

    return (
        <>
            {/* Card */}
            <Card
                onClick={() => setOpen(true)}
                sx={{
                    height: 360,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    boxShadow: 3,
                    backgroundColor: "background.paper",
                    overflow: "hidden",
                    cursor: "pointer",
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

            {/* Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
                    {auction.year} {auction.make} {auction.model}
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <img
                            src={auction.mainImageUrl}
                            alt={auction.title}
                            style={{
                                width: "100%",
                                borderRadius: "8px",
                                objectFit: "cover",
                            }}
                        />

                        <Divider sx={{ my: 2 }} />

                        {/* 🔹 Side-by-side Specs + Sale Info */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                justifyContent: "space-between",
                                gap: 4,
                            }}
                        >
                            {/* Specifications */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Specifications
                                </Typography>
                                <Typography variant="body2">
                                    Engine: {auction.engine || "N/A"}
                                    <br />
                                    Drivetrain: {auction.drivetrain || "N/A"}
                                    <br />
                                    Transmission: {auction.transmission || "N/A"}
                                    <br />
                                    Exterior: {auction.exteriorColor || "N/A"}
                                    <br />
                                    Interior: {auction.interiorColor || "N/A"}
                                </Typography>
                            </Box>

                            {/* Sale Info */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Sale Info
                                </Typography>
                                <Typography variant="body2">
                                    Sale Type: {auction.saleType || "—"}
                                    <br />
                                    Final Price:{" "}
                                    {auction.finalSalePrice
                                        ? `$${auction.finalSalePrice.toLocaleString()}`
                                        : auction.finalBidPrice
                                            ? `$${auction.finalBidPrice.toLocaleString()}`
                                            : "—"}
                                    <br />
                                    Bids: {auction.numBids || 0} · Comments:{" "}
                                    {auction.numComments || 0}
                                    <br />
                                    Views: {auction.numViews || 0}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* 🔹 Related Price-Year Chart */}
                        <Box sx={{ textAlign: "center", my: 2 }}>
                            <Typography
                                variant="subtitle1"
                                color="text.secondary"
                                gutterBottom
                            >
                                {auction.make} {auction.model} — Price vs. Year
                            </Typography>
                            {loadingChart ? (
                                <CircularProgress color="primary" size={32} />
                            ) : relatedAuctions.length > 0 ? (
                                <PriceYearChart auctions={relatedAuctions} />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No data available for this model yet.
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ textAlign: "center" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<OpenInNewIcon />}
                                href={auction.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on Cars & Bids
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}
