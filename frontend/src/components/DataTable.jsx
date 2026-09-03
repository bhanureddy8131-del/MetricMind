export default function DataTable({ data = [], empty = 'No records to display.' }) {
  if (!data.length) return <div className="empty-state">{empty}</div>
  const columns = Object.keys(data[0])
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{typeof row[column] === 'number' ? row[column].toLocaleString() : String(row[column] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}
