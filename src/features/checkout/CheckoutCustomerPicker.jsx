import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Search, UserRound } from "lucide-react";

export function CheckoutCustomerPicker({ customers, selectedCustomerId, onSelect, disabled, onAddCustomer }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();
  const selectedCustomer = customers.find((customer) => String(customer.id) === String(selectedCustomerId));
  const options = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    const matching = customers.filter((customer) => {
      const searchable = [customer.name, customer.email, customer.phone].filter(Boolean).join(" ").toLocaleLowerCase();
      return !search || searchable.includes(search);
    });
    return [{ id: "", name: "Walk-in customer" }, ...matching];
  }, [customers, query]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectOption = (option) => {
    onSelect(option.id ? String(option.id) : "");
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
      setOpen(true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      setOpen(true);
    } else if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      selectOption(options[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="checkout-customer-picker" ref={rootRef}>
      <span className="checkout-customer-icon" aria-hidden="true"><UserRound size={16} /></span>
      <div className="checkout-customer-field">
        <label htmlFor={`${listId}-input`}>Customer</label>
        <div className="checkout-customer-input-wrap">
          <Search size={14} aria-hidden="true" />
          <input
            id={`${listId}-input`}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search customers"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && options[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
            placeholder="Search customers"
            value={open ? query : selectedCustomer?.name ?? "Walk-in customer"}
            disabled={disabled}
            onFocus={() => {
              setQuery("");
              setActiveIndex(0);
              setOpen(true);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        {open && <div className="checkout-customer-options" id={listId} role="listbox" aria-label="Customers">
          {options.length ? options.map((option, index) => {
            const selected = String(option.id) === String(selectedCustomerId ?? "");
            return <button
              type="button"
              role="option"
              id={`${listId}-option-${index}`}
              aria-selected={selected}
              className={`${selected ? "is-selected " : ""}${index === activeIndex ? "is-active" : ""}`}
              key={option.id || "walk-in"}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span className="checkout-customer-option-copy">
                <strong>{option.name}</strong>
                {(option.phone || option.email) && <small>{option.phone || option.email}</small>}
              </span>
              {selected && <Check size={15} aria-hidden="true" />}
            </button>;
          }) : <p className="checkout-customer-empty">No customers match “{query}”.</p>}
        </div>}
      </div>
      <button
        type="button"
        className="customer-add-button"
        aria-label="Add customer"
        title="Add Customer"
        disabled={disabled}
        onClick={onAddCustomer}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
