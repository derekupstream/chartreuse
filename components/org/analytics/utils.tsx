export const defaultFormatter = (val: number) => {
  return typeof val === 'number' ? (
    val === 0 || val === -0 ? (
      0
    ) : (
      val.toLocaleString()
    )
  ) : (
    <span style={{ color: 'grey', fontSize: '12px' }}>N/A</span>
  );
};
