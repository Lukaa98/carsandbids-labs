import React, { useEffect, useMemo, useState } from "react";
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

const FILTER_KEYS = [
  "make",
  "model",
  "minHp",
  "maxHp",
  "minPrice",
  "maxPrice",
  "transmission",
  "drivetrain",
  "exteriorColor",
  "interiorColor",
  "saleType",
  "sellerType",
];

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
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

        <TextField
          select
          label="Min HP"
          value={filters.minHp}
          onChange={handleFilterChange("minHp")}
        >
          <MenuItem value="">Any</MenuItem>
          {horsepowerOptions.map((hp) => (
            <MenuItem key={hp} value={hp}>
              {hp}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Max HP"
          value={filters.maxHp}
          onChange={handleFilterChange("maxHp")}
        >
          <MenuItem value="">Any</MenuItem>
          {horsepowerOptions.map((hp) => (
            <MenuItem key={hp} value={hp}>
              {hp}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Min Price"
          value={filters.minPrice}
          onChange={handleFilterChange("minPrice")}
        >
          <MenuItem value="">Any</MenuItem>
          {priceOptions.map((price) => (
            <MenuItem key={price} value={price}>
              ${price.toLocaleString()}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Max Price"
          value={filters.maxPrice}
          onChange={handleFilterChange("maxPrice")}
        >
          <MenuItem value="">Any</MenuItem>
          {priceOptions.map((price) => (
            <MenuItem key={price} value={price}>
              ${price.toLocaleString()}
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
