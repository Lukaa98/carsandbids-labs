import React, { useState, useRef } from "react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Label,
    Tooltip,
} from "recharts";
import { Box, Typography, Fade, Paper } from "@mui/material";

export default function PriceMileageChart({ auctions }) {
    const [hoveredCar, setHoveredCar] = useState(null);
    const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
    const timeoutRef = useRef(null);
    const chartContainerRef = useRef(null);

    if (!auctions || auctions.length === 0) return null;

    const data = auctions
        .map((a) => {
            const mileage = Number(a.mileage);
            const price = a.finalSalePrice || a.finalBidPrice || 0;
            if (!Number.isFinite(mileage) || !price) return null;
            return {
                mileage,
                price,
                label: `${a.year || ""} ${a.make || ""} ${a.model || ""}`.trim(),
                image: a.mainImageUrl,
                url: a.url,
                location: a.location,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.mileage - b.mileage);

    if (data.length === 0) return null;

    const handleMouseMove = (dotInfo) => {
        if (dotInfo && dotInfo.payload && chartContainerRef.current) {
            clearTimeout(timeoutRef.current);
            const { cx, cy } = dotInfo;
            const { mileage, price, label, image, url, location } = dotInfo.payload;
            setAnchorPos({ x: cx, y: cy });
            setHoveredCar({ mileage, price, label, image, url, location });
        }
    };

    const hideWithDelay = () => {
        timeoutRef.current = setTimeout(() => setHoveredCar(null), 300);
    };

    return (
        <Box
            ref={chartContainerRef}
            sx={{
                width: "100%",
                maxWidth: "1000px",
                my: 4,
                p: 3,
                borderRadius: 3,
                backgroundColor: "background.paper",
                boxShadow: 3,
                position: "relative",
            }}
        >
            <Typography variant="h6" fontWeight="bold" gutterBottom textAlign="center">
                Price vs. Mileage
            </Typography>

            <Box sx={{ position: "relative" }}>
                <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="mileage"
                            type="number"
                            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                            tick={{ fill: "#ccc" }}
                        >
                            <Label value="Mileage" offset={-10} position="insideBottom" />
                        </XAxis>
                        <YAxis
                            dataKey="price"
                            type="number"
                            tickFormatter={(v) => `$${v.toLocaleString()}`}
                            tick={{ fill: "#ccc" }}
                        >
                            <Label
                                value="Price (USD)"
                                angle={-90}
                                position="insideLeft"
                                style={{ textAnchor: "middle" }}
                            />
                        </YAxis>
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<></>} />
                        <Scatter
                            name="Auctions"
                            data={data}
                            fill="#FFB020"
                            line={{ stroke: "#FFB020", strokeWidth: 2 }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={hideWithDelay}
                        />
                    </ScatterChart>
                </ResponsiveContainer>

                <Fade in={!!hoveredCar}>
                    <Paper
                        onMouseEnter={() => clearTimeout(timeoutRef.current)}
                        onMouseLeave={hideWithDelay}
                        elevation={6}
                        sx={{
                            position: "absolute",
                            left: `${anchorPos.x}px`,
                            top: `${anchorPos.y}px`,
                            transform: "translate(-50%, 15px)",
                            backgroundColor: "#1E2631",
                            color: "white",
                            borderRadius: 2,
                            p: 1.5,
                            zIndex: 20,
                            width: 240,
                            pointerEvents: hoveredCar ? "auto" : "none",
                        }}
                    >
                        {hoveredCar && (
                            <>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {hoveredCar.label}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#ccc", mb: 1 }}>
                                    Mileage: {hoveredCar.mileage.toLocaleString()} mi
                                    <br />
                                    Price: ${hoveredCar.price.toLocaleString()}
                                    <br />
                                    {hoveredCar.location}
                                </Typography>

                                {hoveredCar.image && (
                                    <Box
                                        component="img"
                                        src={hoveredCar.image}
                                        alt={hoveredCar.label}
                                        sx={{
                                            width: "100%",
                                            height: 100,
                                            objectFit: "cover",
                                            borderRadius: 1,
                                            mb: 1,
                                        }}
                                    />
                                )}

                                {hoveredCar.url && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#FFB020",
                                            textDecoration: "underline",
                                        }}
                                        component="a"
                                        href={hoveredCar.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Listing →
                                    </Typography>
                                )}
                            </>
                        )}
                    </Paper>
                </Fade>
            </Box>
        </Box>
    );
}
