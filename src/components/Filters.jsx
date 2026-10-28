// Filters for the SonomaStay hotel listings page

import Tag from "@/src/components/Tag.jsx";

function FilterSelect({ label, options, value, onChange, name, icon }) {
  return (
    <div>
      <img src={icon} alt="" />
      <label>
        {label}
        <select value={value} onChange={onChange} name={name}>
          {options.map((option, index) => (
            <option value={option} key={index}>
              {option === "" ? "All" : option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function Filters({ filters, setFilters }) {
  const handleSelectionChange = (event, name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: event.target.value,
    }));
  };

  const updateField = (type, value) => {
    setFilters({ ...filters, [type]: value });
  };

  return (
    <section className="filter">
      <details className="filter-menu">
        <summary>
          <img src="/filter.svg" alt="" />
          <div>
            <p>Stays</p>
            <p>Sorted by {filters.sort || "Rating"}</p>
          </div>
        </summary>

        <form
          method="GET"
          onSubmit={(event) => {
            event.preventDefault();
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
        >
          <FilterSelect
            label="Stay type"
            options={[
              "",
              "Boutique Hotel",
              "Wine Country Inn",
              "Bed & Breakfast",
              "Luxury Resort",
              "Country Lodge",
              "Guesthouse",
              "Spa & Wellness",
              "Riverside Retreat",
            ]}
            value={filters.category}
            onChange={(event) => handleSelectionChange(event, "category")}
            name="category"
            icon="/food.svg"
          />

          <FilterSelect
            label="Location"
            options={[
              "",
              "Sonoma",
              "Healdsburg",
              "Santa Rosa",
              "Glen Ellen",
              "Kenwood",
              "Sebastopol",
              "Petaluma",
              "Guerneville",
              "Windsor",
              "Forestville",
            ]}
            value={filters.city}
            onChange={(event) => handleSelectionChange(event, "city")}
            name="city"
            icon="/location.svg"
          />

          <FilterSelect
            label="Nightly price"
            options={["", "$", "$$", "$$$", "$$$$"]}
            value={filters.price}
            onChange={(event) => handleSelectionChange(event, "price")}
            name="price"
            icon="/price.svg"
          />

          <FilterSelect
            label="Sort by"
            options={["Rating", "Review"]}
            value={filters.sort || "Rating"}
            onChange={(event) => handleSelectionChange(event, "sort")}
            name="sort"
            icon="/sortBy.svg"
          />

          <footer>
            <menu>
              <button
                className="button--cancel"
                type="reset"
                onClick={() => {
                  setFilters({
                    city: "",
                    category: "",
                    price: "",
                    sort: "",
                  });
                }}
              >
                Reset
              </button>

              <button type="submit" className="button--confirm">
                Apply filters
              </button>
            </menu>
          </footer>
        </form>
      </details>

      <div className="tags">
        {Object.entries(filters).map(([type, value]) => {
          if (type === "sort" || value === "") {
            return null;
          }

          return (
            <Tag
              key={type}
              type={type}
              value={value}
              updateField={updateField}
            />
          );
        })}
      </div>
    </section>
  );
}