interface SkeletonLoaderProps {
  variant?: "text" | "table" | "card";
  rows?: number;
  columns?: number;
}

const SkeletonLine = ({ width = "100%" }: { width?: string }) => (
  <div
    className="placeholder-glow mb-2"
  >
    <span className="placeholder col-12 rounded" style={{ width, height: "1rem" }} />
  </div>
);

const SkeletonText = ({ rows = 3 }: { rows?: number }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonLine
        key={i}
        width={i === rows - 1 ? "60%" : "100%"}
      />
    ))}
  </div>
);

const SkeletonTable = ({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) => (
  <div className="table-responsive">
    <table className="table">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="placeholder-glow">
              <span className="placeholder col-8 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={colIdx} className="placeholder-glow">
                <span className="placeholder col-10 rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SkeletonCard = () => (
  <div className="card">
    <div className="card-body">
      <div className="placeholder-glow">
        <span className="placeholder col-6 rounded mb-3" style={{ height: "1.5rem" }} />
      </div>
      <SkeletonText rows={3} />
    </div>
  </div>
);

const SkeletonLoader = ({
  variant = "text",
  rows = 5,
  columns = 5,
}: SkeletonLoaderProps) => {
  switch (variant) {
    case "table":
      return <SkeletonTable rows={rows} columns={columns} />;
    case "card":
      return <SkeletonCard />;
    case "text":
    default:
      return <SkeletonText rows={rows} />;
  }
};

export default SkeletonLoader;
