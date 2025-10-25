import React, { useEffect, useState } from "react";
import { Grid, Box, CircularProgress, Typography } from "@mui/material";
import { fetchAuctions } from "../api";
import AuctionCard from "../components/AuctionCard";
import Filters from "../components/Filters";

export default function Dashboard() {
    const [auctions, setAuctions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        drivetrain: "",
        exteriorColor: "",
    });

    // Fetch auctions on load
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchAuctions();
                setAuctions(data);
                setFiltered(data);
            } catch (err) {
                console.error("Failed to load auctions:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Filter auctions when filters change
    useEffect(() => {
        const filteredData = auctions.filter((a) => {
            return (
                (!filters.search ||
                    `${a.make} ${a.model}`
                        .toLowerCase()
                        .includes(filters.search.toLowerCase())) &&
                (!filters.drivetrain ||
                    a.drivetrain?.toLowerCase() === filters.drivetrain.toLowerCase()) &&
                (!filters.exteriorColor ||
                    a.exteriorColor
                        ?.toLowerCase()
                        .includes(filters.exteriorColor.toLowerCase()))
            );
        });
        setFiltered(filteredData);
    }, [filters, auctions]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                Featured Auctions
            </Typography>

            <Filters filters={filters} setFilters={setFilters} />

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    No matching results found.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {filtered.map((auction) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={auction.id}>
                            <AuctionCard auction={auction} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
