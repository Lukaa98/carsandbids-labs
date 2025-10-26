import React, { useEffect, useState } from "react";
import {
    Box,
    CircularProgress,
    TextField,
    MenuItem,
    Pagination,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAuctions } from "../api";
import AuctionCard from "../components/AuctionCard";

export default function Dashboard() {
    const { page = "1" } = useParams();
    const navigate = useNavigate();

    const [auctions, setAuctions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ make: "", model: "" });
    const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

    const pageNum = parseInt(page, 10);

    // Fetch paginated auctions
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await fetchAuctions(pageNum, 50); // uses backend pagination
                setAuctions(data.results || []);
                setFiltered(data.results || []);
                setMeta({ totalPages: data.totalPages || 1, total: data.total || 0 });
            } catch (err) {
                console.error("Failed to fetch auctions:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [pageNum]);

    // Filter within current page
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

    const handlePageChange = (_, value) => navigate(`/carsandbids-labs/${value}`);

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

            {/* Auction Cards */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
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

                    {/* Pagination */}
                    <Box sx={{ mt: 4 }}>
                        <Pagination
                            count={meta.totalPages}
                            page={pageNum}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                        />
                    </Box>
                </>
            )}
        </Box>
    );
}
