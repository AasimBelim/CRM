import { Row, Col, FormGroup, Label, Input, Button } from "reactstrap";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear?: () => void;
  label?: string;
  showPresets?: boolean;
}

const DateRangePicker = ({
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  onClear,
  label,
  showPresets = true,
}: DateRangePickerProps) => {
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onStartDateChange(start.toISOString().split("T")[0]);
    onEndDateChange(end.toISOString().split("T")[0]);
  };

  const applyThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    onStartDateChange(start.toISOString().split("T")[0]);
    onEndDateChange(now.toISOString().split("T")[0]);
  };

  const handleClear = () => {
    onStartDateChange("");
    onEndDateChange("");
    onClear?.();
  };

  return (
    <div>
      {label && <Label className="fw-semibold mb-2">{label}</Label>}
      <Row className="g-2">
        <Col xs={6}>
          <FormGroup className="mb-0">
            <Label className="small text-muted mb-1">From</Label>
            <Input
              type="date"
              bsSize="sm"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col xs={6}>
          <FormGroup className="mb-0">
            <Label className="small text-muted mb-1">To</Label>
            <Input
              type="date"
              bsSize="sm"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>
      {showPresets && (
        <div className="mt-2 d-flex flex-wrap gap-1">
          <Button size="sm" outline color="secondary" onClick={() => applyPreset(0)}>
            Today
          </Button>
          <Button size="sm" outline color="secondary" onClick={() => applyPreset(7)}>
            Last 7 days
          </Button>
          <Button size="sm" outline color="secondary" onClick={() => applyPreset(30)}>
            Last 30 days
          </Button>
          <Button size="sm" outline color="secondary" onClick={applyThisMonth}>
            This month
          </Button>
          {(startDate || endDate) && (
            <Button size="sm" outline color="danger" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
