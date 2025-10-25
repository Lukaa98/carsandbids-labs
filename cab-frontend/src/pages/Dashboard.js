import React, { useEffect, useState } from "react";
import {
    Box,
    CircularProgress,
    TextField,
    MenuItem,
} from "@mui/material";
import { fetchAuctions } from "../api";
import AuctionCard from "../components/AuctionCard";

export default function Dashboard() {
    const [auctions, setAuctions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ make: "", model: "" });

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchAuctions();
                setAuctions(data);
                setFiltered(data);
            } catch (err) {
                console.error("Failed to fetch auctions:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const filteredData = auctions.filter(
            (a) =>
                (!filters.make ||
                    a.make?.toLowerCase().includes(filters.make.toLowerCase())) &&
                (!filters.model ||
                    a.model?.toLowerCase().includes(filters.model.toLowerCase()))
        );
        setFiltered(filteredData);
    }, [filters, auctions]);

    const makes = [...new Set(auctions.map((a) => a.make))].sort();
    const models = [...new Set(auctions.map((a) => a.model))].sort();

    return (
        <Box
            sx={{
                p: 4,
                backgroundColor: "background.default",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            {/* Filters */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    mb: 4,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    width: "100%",
                    maxWidth: "1200px",
                }}
            >
                <TextField
                    select
                    label="Make"
                    value={filters.make}
                    onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {makes.map((make) => (
                        <MenuItem key={make} value={make}>
                            {make}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Model"
                    value={filters.model}
                    onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {models.map((model) => (
                        <MenuItem key={model} value={model}>
                            {model}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Strict 4-column grid */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(1, 1fr)",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(3, 1fr)",
                            lg: "repeat(4, 1fr)",
                        },
                        gap: 3,
                        width: "100%",
                        maxWidth: "1600px",
                    }}
                >
                    {filtered.map((auction) => (
                        <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </Box>
            )}
        </Box>
    );
}
