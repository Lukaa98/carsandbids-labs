import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";

export default function Navbar() {
    const menuItems = [
        "Auctions",
        "Sell a Car",
        "Community",
        "Events",
        "About Us",
        "Leaderboard",
    ];

    return (
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar sx={{ justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight="bold">
                    Cars & Bids Labs
                </Typography>
                <Box>
                    {menuItems.map((item) => (
                        <Button key={item} color="inherit" sx={{ textTransform: "none" }}>
                            {item}
                        </Button>
                    ))}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
