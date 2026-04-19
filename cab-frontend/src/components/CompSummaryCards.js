import React from "react";
import { Box, Paper, Typography } from "@mui/material";

function formatCurrency(value) {
    if (!Number.isFinite(value)) return "-";
    return `$${Math.round(value).toLocaleString()}`;
}

function formatNumber(value) {
    if (!Number.isFinite(value)) return "-";
    return Math.round(value).toLocaleString();
}

const cards = [
    { key: "compCount", label: "Comps Found", format: formatNumber },
    { key: "avgSoldPrice", label: "Avg Sold Price", format: formatCurrency },
    { key: "medianSoldPrice", label: "Median Sold Price", format: formatCurrency },
    { key: "sellThroughRate", label: "Sell-Through", format: (value) => `${value}%` },
    { key: "avgMileage", label: "Avg Mileage", format: (value) => `${formatNumber(value)} mi` },
    { key: "avgBids", label: "Avg Bids", format: formatNumber },
];

export default function CompSummaryCards({ summary }) {
    if (!summary) return null;

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                },
                gap: 2,
                width: "100%",
            }}
        >
            {cards.map((card) => (
                <Paper
                    key={card.key}
                    elevation={2}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "background.default",
                    }}
                >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {card.label}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        {card.format(summary[card.key])}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
}
