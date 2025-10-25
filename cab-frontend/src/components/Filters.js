import React from "react";
import { Box, TextField, MenuItem, Grid } from "@mui/material";

export default function Filters({ filters, setFilters }) {
    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Search (Make / Model)"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        select
                        label="Drivetrain"
                        name="drivetrain"
                        value={filters.drivetrain}
                        onChange={handleChange}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="4WD/AWD">4WD/AWD</MenuItem>
                        <MenuItem value="FWD">FWD</MenuItem>
                        <MenuItem value="RWD">RWD</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Exterior Color"
                        name="exteriorColor"
                        value={filters.exteriorColor}
                        onChange={handleChange}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
