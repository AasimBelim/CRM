import { useState, type ReactNode } from "react";
import {
  Card,
  CardBody,
  Collapse,
  Button,
  Row,
  Col,
} from "reactstrap";
import { Filter, ChevronDown, ChevronUp, X } from "lucide-react";

interface FilterPanelProps {
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  activeFilterCount?: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const FilterPanel = ({
  children,
  onApply,
  onClear,
  activeFilterCount = 0,
  collapsible = true,
  defaultOpen = false,
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const header = (
    <div className="d-flex align-items-center justify-content-between">
      <span className="d-flex align-items-center gap-2">
        <Filter size={16} />
        <span className="fw-semibold">Filters</span>
        {activeFilterCount > 0 && (
          <span className="badge bg-primary rounded-pill">
            {activeFilterCount}
          </span>
        )}
      </span>
      {collapsible && (
        <Button
          color="link"
          size="sm"
          className="text-muted p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      )}
    </div>
  );

  const content = (
    <div className="mt-3">
      <Row className="g-3">{children}</Row>
      <div className="d-flex gap-2 mt-3">
        <Button color="primary" size="sm" onClick={onApply}>
          Apply Filters
        </Button>
        {activeFilterCount > 0 && (
          <Button
            color="secondary"
            outline
            size="sm"
            onClick={onClear}
            className="d-flex align-items-center gap-1"
          >
            <X size={14} /> Clear All
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="mb-3">
      <CardBody className="py-2 px-3">
        {header}
        {collapsible ? (
          <Collapse isOpen={isOpen}>{content}</Collapse>
        ) : (
          content
        )}
      </CardBody>
    </Card>
  );
};

// Helper child component for individual filter fields
interface FilterFieldProps {
  label: string;
  children: ReactNode;
  colSize?: number;
}

export const FilterField = ({
  label,
  children,
  colSize = 3,
}: FilterFieldProps) => (
  <Col md={colSize} sm={6}>
    <label className="form-label small text-muted mb-1">{label}</label>
    {children}
  </Col>
);

export default FilterPanel;
