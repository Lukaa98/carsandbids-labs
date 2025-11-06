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

export default function PriceYearChart({ auctions }) {
  const [hoveredCar, setHoveredCar] = useState(null);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const chartContainerRef = useRef(null);

  if (!auctions || auctions.length === 0) return null;

  // Prepare chart data
  const data = auctions
    .map((a) => {
      const year = Number(a.year);
      const price = a.finalSalePrice || a.finalBidPrice || 0;
      if (!year || !price) return null;
      return {
        year,
        price,
        label: `${a.year} ${a.make} ${a.model}`,
        image: a.mainImageUrl,
        url: a.url,
        location: a.location,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.year - b.year);

  // Hover logic — position tooltip relative to container
  const handleMouseMove = (dotInfo) => {
    if (dotInfo && dotInfo.payload && chartContainerRef.current) {
      clearTimeout(timeoutRef.current);

      const rect = chartContainerRef.current.getBoundingClientRect();
      const svgX = dotInfo.cx; // ✅ actual SVG X coordinate
      const svgY = dotInfo.cy; // ✅ actual SVG Y coordinate

      // Translate to container coordinate space
      const relativeX = svgX;
      const relativeY = svgY;

      const { year, price, label, image, url, location } = dotInfo.payload;
      setAnchorPos({ x: relativeX, y: relativeY });
      setHoveredCar({ year, price, label, image, url, location });
    }
  };

  // Start delay before hiding popup
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
        Price vs. Year
      </Typography>

      <Box sx={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              type="number"
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fill: "#ccc" }}
            >
              <Label value="Year" offset={-10} position="insideBottom" />
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

            {/* Disable built-in tooltip */}
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<></>} />

            <Scatter
              name="Auctions"
              data={data}
              fill="#00B8D9"
              line={{ stroke: "#00B8D9", strokeWidth: 2 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={hideWithDelay}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Custom hover popup */}
        <Fade in={!!hoveredCar}>
          <Paper
            onMouseEnter={() => clearTimeout(timeoutRef.current)}
            onMouseLeave={hideWithDelay}
            elevation={6}
            sx={{
              position: "absolute",
              left: `${anchorPos.x}px`,
              top: `${anchorPos.y}px`,
              transform: "translate(-50%, 15px)", // directly under the dot
              backgroundColor: "#1E2631",
              color: "white",
              borderRadius: 2,
              p: 1.5,
              zIndex: 20,
              width: 240,
              pointerEvents: hoveredCar ? "auto" : "none",
              transition: "all 0.15s ease-out",
            }}
          >
            {hoveredCar && (
              <>
                <Typography variant="subtitle2" fontWeight="bold">
                  {hoveredCar.label}
                </Typography>
                <Typography variant="body2" sx={{ color: "#ccc", mb: 1 }}>
                  Year: {hoveredCar.year}
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
                      color: "#00B8D9",
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
