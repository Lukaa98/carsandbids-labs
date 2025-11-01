import React, { useEffect, useState } from "react";
import {
    Box,
    CircularProgress,
    TextField,
    MenuItem,
    Pagination,
    Button,
} from "@mui/material";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchAuctions } from "../api";
import AuctionCard from "../components/AuctionCard";

export default function Dashboard() {
    const { page = "1" } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

    const pageNum = parseInt(page, 10);
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";

    // 🔹 Fetch from backend whenever page/make/model changes
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await fetchAuctions({
                    page: pageNum,
                    limit: 50,
                    make,
                    model,
                });
                setAuctions(data.results || []);
                setMeta({
                    totalPages: data.totalPages || 1,
                    total: data.total || 0,
                });
            } catch (err) {
                console.error("Failed to fetch auctions:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [pageNum, make, model]);

    // 🔹 Derive unique makes/models from current page dataset
    const makes = [...new Set(auctions.map((a) => a.make).filter(Boolean))].sort();
    const modelsByMake = auctions
        .filter((a) => a.make === make)
        .map((a) => a.model)
        .filter(Boolean);
    const uniqueModels = [...new Set(modelsByMake)].sort();

    // 🔹 When filters change, update URL query + reset page to 1
    const handleMakeChange = (e) => {
        const newMake = e.target.value;
        setSearchParams({ make: newMake });
        navigate(`/carsandbids-labs/1?make=${encodeURIComponent(newMake)}`);
    };

    const handleModelChange = (e) => {
        const newModel = e.target.value;
        setSearchParams({ make, model: newModel });
        navigate(
            `/carsandbids-labs/1?make=${encodeURIComponent(make)}&model=${encodeURIComponent(
                newModel
            )}`
        );
    };

    const handleReset = () => {
        setSearchParams({});
        navigate(`/carsandbids-labs/1`);
    };

    // 🔹 Pagination retains filters
    const handlePageChange = (_, value) => {
        const params = new URLSearchParams();
        if (make) params.set("make", make);
        if (model) params.set("model", model);
        navigate(`/carsandbids-labs/${value}?${params.toString()}`);
    };

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
            {/* 🔹 Filters */}
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
                {/* Make Filter */}
                <TextField
                    select
                    label="Make"
                    value={make}
                    onChange={handleMakeChange}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {makes.map((m) => (
                        <MenuItem key={m} value={m}>
                            {m}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Model Filter */}
                <TextField
                    select
                    label="Model"
                    value={model}
                    onChange={handleModelChange}
                    sx={{ minWidth: 200 }}
                    disabled={!make}
                >
                    <MenuItem value="">All</MenuItem>
                    {uniqueModels.map((m) => (
                        <MenuItem key={m} value={m}>
                            {m}
                        </MenuItem>
                    ))}
                </TextField>

                <Button variant="outlined" color="secondary" onClick={handleReset}>
                    Reset Filters
                </Button>
            </Box>

            {/* 🔹 Auction Cards */}
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
                        {auctions.map((auction) => (
                            <AuctionCard
                                key={auction.id || auction.auctionId}
                                auction={auction}
                            />
                        ))}
                    </Box>

                    {/* 🔹 Pagination */}
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
