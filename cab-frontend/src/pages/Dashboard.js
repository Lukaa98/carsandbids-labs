import React, { useEffect, useState } from "react";
import {
    Box,
    CircularProgress,
    TextField,
    MenuItem,
    Pagination,
    Button,
    Typography,
} from "@mui/material";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchAuctions } from "../api";
import AuctionCard from "../components/AuctionCard";
import PriceYearChart from "../components/PriceYearChart";

export default function Dashboard() {
    const { page = "1" } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

    // For dropdowns
    const [allMakes, setAllMakes] = useState([]);
    const [allModels, setAllModels] = useState([]);

    const pageNum = parseInt(page, 10);
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";

    // 🔹 Fetch all makes once (used for dropdown)
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchAuctions({ page: 1, limit: 5000 });
                const makes = [...new Set(data.results.map(a => a.make).filter(Boolean))].sort();
                setAllMakes(makes);
            } catch (err) {
                console.error("Failed to fetch makes:", err);
            }
        })();
    }, []);

    //  Fetch models for selected make
    useEffect(() => {
        if (!make) {
            setAllModels([]);
            return;
        }

        (async () => {
            try {
                const data = await fetchAuctions({ page: 1, limit: 5000, make });
                const models = [...new Set(data.results.map(a => a.model).filter(Boolean))].sort();
                setAllModels(models);
            } catch (err) {
                console.error("Failed to fetch models:", err);
            }
        })();
    }, [make]);

    // Fetch auctions whenever page/make/model changes
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchAuctions({
                    page: pageNum,
                    limit: 50,
                    make,
                    model,
                });
                if (isMounted) {
                    setAuctions(data.results || []);
                    setMeta({
                        totalPages: data.totalPages || 1,
                        total: data.total || 0,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch auctions:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [pageNum, make, model]);

    // Handle filter changes
    const handleMakeChange = (e) => {
        const newMake = e.target.value;
        setSearchParams({ make: newMake }); // reset model filter
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

    // Pagination retains filters
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
                    mb: 2,
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
                    {allMakes.map((m) => (
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
                    {allModels.map((m) => (
                        <MenuItem key={m} value={m}>
                            {m}
                        </MenuItem>
                    ))}
                </TextField>

                <Button variant="outlined" color="secondary" onClick={handleReset}>
                    Reset Filters
                </Button>
            </Box>

            {/* Chart Between Filters and Cards */}
            {!loading && make && model && auctions.length > 0 && (
                <PriceYearChart auctions={auctions} />
            )}

            {/* Loading or Results */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
                    {/* Auction Cards */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(1, 1fr)",     // Mobile
                                sm: "repeat(2, 1fr)",     // Small screens
                                md: "repeat(3, 1fr)",     // Medium
                                lg: "repeat(4, 1fr)",     // Large
                                xl: "repeat(5, 1fr)",     // Extra large = 5 per row
                            },
                            gap: 3,
                            width: "100%",
                            maxWidth: "2000px", // slightly widened container
                        }}
                    >
                        {auctions.map((auction) => (
                            <AuctionCard
                                key={auction.id || auction.auctionId}
                                auction={auction}
                            />
                        ))}
                    </Box>

                    {!loading && auctions.length === 0 && (
                        <Typography variant="h6" color="text.secondary" sx={{ mt: 6 }}>
                            No auctions found for this filter.
                        </Typography>
                    )}

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
