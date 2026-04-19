import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  TextField,
  MenuItem,
  Pagination,
  Button,
  Typography,
  Menu,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchAuctions } from "../api";
import AuctionCard from "../components/AuctionCard";
import PriceYearChart from "../components/PriceYearChart";

const FILTER_KEYS = [
  "make",
  "model",
  "minYear",
  "maxYear",
  "minHp",
  "maxHp",
  "minPrice",
  "maxPrice",
  "transmission",
  "drivetrain",
  "bodyStyle",
  "exteriorColor",
  "interiorColor",
  "saleType",
  "sellerType",
];

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function RangeMenuFilter({
  label,
  minValue,
  maxValue,
  minLabel,
  maxLabel,
  options,
  onChange,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        endIcon={<ArrowDropDownIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          justifyContent: "space-between",
          minWidth: 180,
          height: 56,
          borderColor: "rgba(255,255,255,0.23)",
          color: "text.primary",
          textTransform: "none",
          px: 2,
        }}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <TextField
            select
            size="small"
            label={minLabel}
            value={minValue}
            onChange={(event) => onChange("min", event.target.value)}
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="">Any</MenuItem>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            To
          </Typography>
          <TextField
            select
            size="small"
            label={maxLabel}
            value={maxValue}
            onChange={(event) => onChange("max", event.target.value)}
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="">Any</MenuItem>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Menu>
    </>
  );
}

export default function Dashboard() {
  const { page = "1" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [allAuctions, setAllAuctions] = useState([]);

  const pageNum = parseInt(page, 10);

  const filters = useMemo(
    () =>
      FILTER_KEYS.reduce((acc, key) => {
        acc[key] = searchParams.get(key) || "";
        return acc;
      }, {}),
    [searchParams]
  );

  const horsepowerOptions = Array.from({ length: 91 }, (_, i) => (i + 10) * 10);
  const priceOptions = Array.from({ length: 41 }, (_, i) => i * 5000).filter(
    (value) => value > 0
  );
  const yearOptions = useMemo(
    () =>
      uniqueValues(allAuctions, "year")
        .map((year) => Number(year))
        .filter((year) => Number.isFinite(year))
        .sort((a, b) => b - a),
    [allAuctions]
  );
  const yearMenuOptions = useMemo(
    () => yearOptions.map((year) => ({ value: String(year), label: String(year) })),
    [yearOptions]
  );
  const priceMenuOptions = useMemo(
    () =>
      priceOptions.map((price) => ({
        value: String(price),
        label: `$${price.toLocaleString()}`,
      })),
    [priceOptions]
  );

  const allMakes = useMemo(() => uniqueValues(allAuctions, "make"), [allAuctions]);
  const allModels = useMemo(() => {
    const scoped = filters.make
      ? allAuctions.filter((auction) => auction.make === filters.make)
      : allAuctions;
    return uniqueValues(scoped, "model");
  }, [allAuctions, filters.make]);
  const drivetrainOptions = useMemo(
    () => uniqueValues(allAuctions, "drivetrain"),
    [allAuctions]
  );
  const bodyStyleOptions = useMemo(
    () => uniqueValues(allAuctions, "bodyStyle"),
    [allAuctions]
  );
  const saleTypeOptions = useMemo(
    () => uniqueValues(allAuctions, "saleType"),
    [allAuctions]
  );
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAuctions({ page: 1, limit: 5000 });
        setAllAuctions(data.results || []);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      }
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAuctions({
          page: pageNum,
          limit: 50,
          ...filters,
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
  }, [pageNum, filters]);

  const pushFilters = (nextFilters) => {
    const params = new URLSearchParams();
    FILTER_KEYS.forEach((key) => {
      if (nextFilters[key]) {
        params.set(key, nextFilters[key]);
      }
    });

    setSearchParams(params);
    const query = params.toString();
    navigate(`/carsandbids-labs/1${query ? `?${query}` : ""}`);
  };

  const handleFilterChange = (key) => (event) => {
    const value = event.target.value;
    const nextFilters = { ...filters, [key]: value };

    if (key === "make") {
      nextFilters.model = "";
    }
    pushFilters(nextFilters);
  };

  const handleRangeFilterChange = (minKey, maxKey) => (bound, value) => {
    pushFilters({
      ...filters,
      [bound === "min" ? minKey : maxKey]: value,
    });
  };

  const handleReset = () => {
    setSearchParams({});
    navigate(`/carsandbids-labs/1`);
  };

  const handlePageChange = (_, value) => {
    const params = new URLSearchParams();
    FILTER_KEYS.forEach((key) => {
      if (filters[key]) {
        params.set(key, filters[key]);
      }
    });
    const query = params.toString();
    navigate(`/carsandbids-labs/${value}${query ? `?${query}` : ""}`);
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 2,
          width: "100%",
          maxWidth: "1400px",
        }}
      >
        <TextField
          select
          label="Make"
          value={filters.make}
          onChange={handleFilterChange("make")}
        >
          <MenuItem value="">All</MenuItem>
          {allMakes.map((make) => (
            <MenuItem key={make} value={make}>
              {make}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Model"
          value={filters.model}
          onChange={handleFilterChange("model")}
          disabled={!filters.make}
        >
          <MenuItem value="">All</MenuItem>
          {allModels.map((model) => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Transmission"
          value={filters.transmission}
          onChange={handleFilterChange("transmission")}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Automatic">Automatic</MenuItem>
          <MenuItem value="Manual">Manual</MenuItem>
        </TextField>

        <TextField
          select
          label="Drivetrain"
          value={filters.drivetrain}
          onChange={handleFilterChange("drivetrain")}
        >
          <MenuItem value="">All</MenuItem>
          {drivetrainOptions.map((drivetrain) => (
            <MenuItem key={drivetrain} value={drivetrain}>
              {drivetrain}
            </MenuItem>
          ))}
        </TextField>

        <RangeMenuFilter
          label="Years"
          minValue={filters.minYear}
          maxValue={filters.maxYear}
          minLabel="Min"
          maxLabel="Max"
          options={yearMenuOptions}
          onChange={handleRangeFilterChange("minYear", "maxYear")}
        />

        <RangeMenuFilter
          label="Horsepower"
          minValue={filters.minHp}
          maxValue={filters.maxHp}
          minLabel="Min"
          maxLabel="Max"
          options={horsepowerOptions.map((hp) => ({
            value: String(hp),
            label: String(hp),
          }))}
          onChange={handleRangeFilterChange("minHp", "maxHp")}
        />

        <RangeMenuFilter
          label="Price"
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          minLabel="Min"
          maxLabel="Max"
          options={priceMenuOptions}
          onChange={handleRangeFilterChange("minPrice", "maxPrice")}
        />

        <TextField
          select
          label="Body Style"
          value={filters.bodyStyle}
          onChange={handleFilterChange("bodyStyle")}
        >
          <MenuItem value="">All</MenuItem>
          {bodyStyleOptions.map((bodyStyle) => (
            <MenuItem key={bodyStyle} value={bodyStyle}>
              {bodyStyle}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Exterior Color"
          value={filters.exteriorColor}
          onChange={handleFilterChange("exteriorColor")}
          placeholder="Black, Blue, Red..."
        />

        <TextField
          label="Interior Color"
          value={filters.interiorColor}
          onChange={handleFilterChange("interiorColor")}
          placeholder="Black, Tan, White..."
        />

        <TextField
          select
          label="Sale Type"
          value={filters.saleType}
          onChange={handleFilterChange("saleType")}
        >
          <MenuItem value="">All</MenuItem>
          {saleTypeOptions.map((saleType) => (
            <MenuItem key={saleType} value={saleType}>
              {saleType}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Seller Type"
          value={filters.sellerType}
          onChange={handleFilterChange("sellerType")}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Private">Private</MenuItem>
          <MenuItem value="Dealer">Dealer</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ width: "100%", maxWidth: "1400px", mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="body1" color="text.secondary">
          {loading ? "Loading auctions..." : `${meta.total} auctions found`}
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleReset}>
          Reset Filters
        </Button>
      </Box>

      {!loading && filters.make && filters.model && auctions.length > 0 && (
        <PriceYearChart auctions={auctions} />
      )}

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
