import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Database, FileUp, UploadCloud, XCircle } from 'lucide-react'
import { apiService } from '../services/api'
import ErrorMessage from '../components/ErrorMessage'

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Not available'
}

export default function Dataset() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDatasets = async () => {
    try {
      const response = await apiService.getDatasets()
      setDatasets(response.data.datasets || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { loadDatasets() }, [])

  const selectFile = (selectedFile) => {
    setError('')
    setSuccess('')
    setProgress(0)
    if (!selectedFile) return
    const allowed = ['.csv', '.xlsx', '.xls']
    if (!allowed.some((extension) => selectedFile.name.toLowerCase().endsWith(extension))) {
      setFile(null)
      setError('Choose a CSV or Excel file.')
      return
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setFile(null)
      setError('The maximum file size is 50 MB.')
      return
    }
    setFile(selectedFile)
  }

  const upload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiService.uploadDataset(file, (event) => {
        if (event.total) setProgress(Math.round((event.loaded * 100) / event.total))
      })
      setSuccess(response.data.message || 'Dataset uploaded successfully.')
      setFile(null)
      setProgress(100)
      await loadDatasets()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activate = async (datasetId) => {
    setError('')
    setSuccess('')
    try {
      await apiService.activateDataset(datasetId)
      setSuccess('Dataset activated. New analytics and queries will use it.')
      await loadDatasets()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (datasetId) => {
    if (!window.confirm('Delete this uploaded dataset?')) return
    try {
      await apiService.deleteDataset(datasetId)
      await loadDatasets()
    } catch (err) {
      setError(err.message)
    }
  }

  return <div className="page dataset-page">
    <div className="page-heading"><div><p className="eyebrow">DATASET UPLOAD</p><h1>Bring your data into MetricMind.</h1><p className="muted">Upload CSV or Excel data, inspect its shape, and choose the dataset powering queries.</p></div></div>
    <ErrorMessage message={error} />
    {success && <div className="success-box"><CheckCircle2 size={17} /><span>{success}</span></div>}
    <section className="upload-panel">
      <div className="upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]) }}>
        <UploadCloud size={34} />
        <h2>Upload a dataset</h2>
        <p>CSV, XLSX, or XLS up to 50 MB</p>
        <button className="primary-button" type="button" onClick={() => inputRef.current?.click()}><FileUp size={16} /> Choose Dataset</button>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(event) => selectFile(event.target.files[0])} />
      </div>
      {file && <div className="selected-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button className="icon-button" type="button" onClick={() => setFile(null)} aria-label="Remove selected file"><XCircle size={18} /></button></div>}
      {loading && <div className="upload-progress"><div><span>Uploading dataset</span><strong>{progress}%</strong></div><progress max="100" value={progress} /></div>}
      <button className="primary-button upload-button" type="button" disabled={!file || loading} onClick={upload}><Database size={16} /> Upload Dataset</button>
    </section>
    <section className="panel"><div className="panel-heading"><div><h3>Uploaded datasets</h3><span>Only an activated upload replaces the default sales dataset for queries.</span></div></div>
      {datasets.length === 0 ? <p className="muted empty-state">No uploaded datasets yet.</p> : <div className="dataset-list">{datasets.map((dataset) => <article className="dataset-record" key={dataset.id}><div className="dataset-record-main"><div className="dataset-mark"><Database size={20} /></div><div><h3>{dataset.name}</h3><p>{dataset.original_filename} · uploaded {formatDate(dataset.uploaded_at)}</p><div className="dataset-details"><span>{dataset.row_count.toLocaleString()} rows</span><span>{dataset.column_count} columns</span><span>{dataset.file_type.toUpperCase()}</span><span>{dataset.upload_status}</span></div><div className="column-chips">{dataset.columns.map((column) => <span key={column}>{column}</span>)}</div></div></div><div className="dataset-actions">{dataset.is_active ? <span className="status-pill success">Active</span> : <button className="secondary-button" type="button" onClick={() => activate(dataset.id)}>Activate</button>}<button className="text-button" type="button" onClick={() => remove(dataset.id)}>Delete</button></div></article>)}</div>}
    </section>
  </div>
}
