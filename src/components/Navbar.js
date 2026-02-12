import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";

export default function Navbar() {
    return (
        <AppBar position="sticky" color="transparent" elevation={1}>
            <Toolbar sx={{ justifyContent: "center" }}>
                <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                        letterSpacing: "0.5px",
                        textAlign: "center",
                        color: "#00B8D9",
                    }}
                >
                    Cars & Bids Labs — Dashboard
                </Typography>
            </Toolbar>
        </AppBar>
    );
}
