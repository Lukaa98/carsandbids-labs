import React from "react";
import { Box, TextField, MenuItem, Grid } from "@mui/material";

export default function Filters({ filters, setFilters }) {
    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // Generate horsepower options: 100 → 1000 in steps of 10
    const horsepowerOptions = Array.from({ length: 91 }, (_, i) => (i + 10) * 10);

    return (
        <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
                {/* Search */}
                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Search (Make / Model)"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                    />
                </Grid>

                {/* Drivetrain */}
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

                {/* Exterior Color */}
                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Exterior Color"
                        name="exteriorColor"
                        value={filters.exteriorColor}
                        onChange={handleChange}
                    />
                </Grid>

                {/* Horsepower Min */}
                <Grid item xs={6} md={1.5}>
                    <TextField
                        fullWidth
                        select
                        label="Min HP"
                        name="minHp"
                        value={filters.minHp}
                        onChange={handleChange}
                    >
                        <MenuItem value="">Any</MenuItem>
                        {horsepowerOptions.map((hp) => (
                            <MenuItem key={hp} value={hp}>
                                {hp}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Horsepower Max */}
                <Grid item xs={6} md={1.5}>
                    <TextField
                        fullWidth
                        select
                        label="Max HP"
                        name="maxHp"
                        value={filters.maxHp}
                        onChange={handleChange}
                    >
                        <MenuItem value="">Any</MenuItem>
                        {horsepowerOptions.map((hp) => (
                            <MenuItem key={hp} value={hp}>
                                {hp}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>
        </Box>
    );
}
