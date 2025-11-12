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

    // Dropdown data
    const [allMakes, setAllMakes] = useState([]);
    const [allModels, setAllModels] = useState([]);

    // Query params
    const pageNum = parseInt(page, 10);
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";
    const minHp = searchParams.get("minHp") || "";
    const maxHp = searchParams.get("maxHp") || "";

    // 🔹 Generate horsepower options (100 → 1000 step 10)
    const horsepowerOptions = Array.from({ length: 91 }, (_, i) => (i + 10) * 10);

    // 🔹 Fetch all makes once
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

    // 🔹 Fetch models for selected make
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

    // 🔹 Fetch auctions on filter change
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
                    minHp,
                    maxHp,
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
    }, [pageNum, make, model, minHp, maxHp]);

    // 🔹 Filter handlers
    const handleMakeChange = (e) => {
        const newMake = e.target.value;
        setSearchParams({ make: newMake });
        navigate(`/carsandbids-labs/1?make=${encodeURIComponent(newMake)}`);
    };

    const handleModelChange = (e) => {
        const newModel = e.target.value;
        setSearchParams({ make, model: newModel });
        navigate(`/carsandbids-labs/1?make=${encodeURIComponent(make)}&model=${encodeURIComponent(newModel)}`);
    };

    const handleMinHpChange = (e) => {
        const newMin = e.target.value;
        setSearchParams({ make, model, minHp: newMin, maxHp });
        navigate(
            `/carsandbids-labs/1?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&minHp=${newMin}&maxHp=${maxHp}`
        );
    };

    const handleMaxHpChange = (e) => {
        const newMax = e.target.value;
        setSearchParams({ make, model, minHp, maxHp: newMax });
        navigate(
            `/carsandbids-labs/1?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&minHp=${minHp}&maxHp=${newMax}`
        );
    };

    const handleReset = () => {
        setSearchParams({});
        navigate(`/carsandbids-labs/1`);
    };

    // 🔹 Pagination keeps filters
    const handlePageChange = (_, value) => {
        const params = new URLSearchParams();
        if (make) params.set("make", make);
        if (model) params.set("model", model);
        if (minHp) params.set("minHp", minHp);
        if (maxHp) params.set("maxHp", maxHp);
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
                {/* Make */}
                <TextField
                    select
                    label="Make"
                    value={make}
                    onChange={handleMakeChange}
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {allMakes.map((m) => (
                        <MenuItem key={m} value={m}>
                            {m}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Model */}
                <TextField
                    select
                    label="Model"
                    value={model}
                    onChange={handleModelChange}
                    sx={{ minWidth: 180 }}
                    disabled={!make}
                >
                    <MenuItem value="">All</MenuItem>
                    {allModels.map((m) => (
                        <MenuItem key={m} value={m}>
                            {m}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Min HP */}
                <TextField
                    select
                    label="Min HP"
                    value={minHp}
                    onChange={handleMinHpChange}
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="">Any</MenuItem>
                    {horsepowerOptions.map((hp) => (
                        <MenuItem key={hp} value={hp}>
                            {hp}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Max HP */}
                <TextField
                    select
                    label="Max HP"
                    value={maxHp}
                    onChange={handleMaxHpChange}
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="">Any</MenuItem>
                    {horsepowerOptions.map((hp) => (
                        <MenuItem key={hp} value={hp}>
                            {hp}
                        </MenuItem>
                    ))}
                </TextField>

                <Button variant="outlined" color="secondary" onClick={handleReset}>
                    Reset Filters
                </Button>
            </Box>

            {/* Chart */}
            {!loading && make && model && auctions.length > 0 && (
                <PriceYearChart auctions={auctions} />
            )}

            {/* Results */}
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
                                xl: "repeat(5, 1fr)",
                            },
                            gap: 3,
                            width: "100%",
                            maxWidth: "2000px",
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
