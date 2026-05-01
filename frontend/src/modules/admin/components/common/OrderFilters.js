import React from "react";
import FilterTabs from "./FilterTabs";

export default function OrderFilters({ value, onChange, options }) {
  return <FilterTabs options={options} value={value} onChange={onChange} />;
}
