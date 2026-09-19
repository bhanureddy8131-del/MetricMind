import { useEffect, useRef, useState } from 'react'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  Rows3,
  Columns3,
  HardDrive,
  Check,
  Trash2,
  Zap,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react'

import { apiService } from '../services/api'
import './DatasetUpload.css'

export default function DatasetUpload() {
  const [file, setFile] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fileInputRef = useRef(null)

  const loadDatasets = async () => {
    try {
      const response = await apiService.getDatasets()

      const data =
        response?.data?.datasets ||
        response?.data ||
        []

      setDatasets(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load datasets:', err)
      setError('Unable to load datasets.')
    }
  }

  useEffect(() => {
    loadDatasets()
  }, [])

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return false
    }

    const validExtensions = ['.csv', '.xlsx', '.xls']
    const fileName = selectedFile.name.toLowerCase()

    const valid = validExtensions.some((extension) =>
      fileName.endsWith(extension)
    )

    if (!valid) {
      setError('Please select a CSV, XLSX, or XLS file.')
      setFile(null)
      return false
    }

    setError('')
    setMessage('')
    setProgress(0)
    setFile(selectedFile)

    return true
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    validateFile(selectedFile)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()

    setDragActive(false)

    const droppedFile = event.dataTransfer.files?.[0]

    validateFile(droppedFile)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a dataset first.')
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage('')
    setError('')

    try {
      const response = await apiService.uploadDataset(
        file,
        (event) => {
          if (event?.total) {
            setProgress(
              Math.round(
                (event.loaded / event.total) * 100
              )
            )
          }
        }
      )

      console.log('Upload response:', response)

      const uploadedDataset =
        response?.data?.dataset

      if (uploadedDataset?.id) {
        try {
          await apiService.activateDataset(
            uploadedDataset.id
          )
        } catch (activateError) {
          console.error(
            'Dataset uploaded but activation failed:',
            activateError
          )
        }
      }

      setProgress(100)
      setMessage('Dataset uploaded and activated successfully.')
      setFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await loadDatasets()
    } catch (err) {
      console.error('Dataset upload error:', err)

      const status = err?.response?.status

      if (status === 401) {
        setError(
          'Your login session has expired. Please log in again.'
        )
      } else if (status === 404) {
        setError(
          'Upload API not found. Make sure the backend is running on port 8001.'
        )
      } else {
        setError(
          err?.response?.data?.detail ||
          err?.message ||
          'Dataset upload failed.'
        )
      }
    } finally {
      setUploading(false)
    }
  }

  const handleActivate = async (dataset) => {
    if (!dataset?.id) return

    setActionLoading(`activate-${dataset.id}`)
    setError('')
    setMessage('')

    try {
      await apiService.activateDataset(dataset.id)

      setMessage(
        `"${dataset.name || dataset.original_filename}" is now active.`
      )

      await loadDatasets()
    } catch (err) {
      console.error('Activate dataset error:', err)

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to activate dataset.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (dataset) => {
    if (!dataset?.id) return

    const name =
      dataset.name ||
      dataset.original_filename ||
      'this dataset'

    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setActionLoading(`delete-${dataset.id}`)
    setError('')
    setMessage('')

    try {
      await apiService.deleteDataset(dataset.id)

      setMessage(`"${name}" was deleted.`)

      if (selectedDataset?.id === dataset.id) {
        setSelectedDataset(null)
      }

      await loadDatasets()
    } catch (err) {
      console.error('Delete dataset error:', err)

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to delete dataset.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '—'

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'Unknown date'
    }

    try {
      return new Date(dateValue).toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    } catch {
      return 'Unknown date'
    }
  }

  const getColumns = (dataset) => {
    if (!dataset?.columns) {
      return []
    }

    if (Array.isArray(dataset.columns)) {
      return dataset.columns
    }

    if (typeof dataset.columns === 'string') {
      try {
        const parsed = JSON.parse(dataset.columns)

        if (Array.isArray(parsed)) {
          return parsed
        }

        if (typeof parsed === 'object') {
          return Object.keys(parsed)
        }
      } catch {
        return dataset.columns
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    }

    return []
  }

  const totalRows = datasets.reduce(
    (sum, dataset) =>
      sum + Number(dataset.row_count || 0),
    0
  )

  const activeDataset =
    datasets.find((dataset) => dataset.is_active) || null

  return (
    <div className="dataset-page">
      <div className="dataset-container">

        {/* HEADER */}

        <header className="dataset-header">

          <div>
            <div className="dataset-eyebrow">
              <Database size={15} />
              DATA MANAGEMENT
            </div>

            <h1>Dataset Management</h1>

            <p>
              Upload, manage and activate the data that powers
              your MetricMind analytics.
            </p>
          </div>

          <button
            className="refresh-datasets"
            type="button"
            onClick={loadDatasets}
            disabled={uploading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

        </header>


        {/* SUMMARY CARDS */}

        <section className="dataset-stats">

          <div className="dataset-stat-card">
            <div className="dataset-stat-icon blue">
              <Database size={20} />
            </div>

            <div>
              <span>Total Datasets</span>
              <strong>{datasets.length}</strong>
            </div>
          </div>


          <div className="dataset-stat-card">
            <div className="dataset-stat-icon green">
              <CheckCircle size={20} />
            </div>

            <div>
              <span>Active Dataset</span>
              <strong>
                {activeDataset ? '1' : '0'}
              </strong>
            </div>
          </div>


          <div className="dataset-stat-card">
            <div className="dataset-stat-icon purple">
              <Rows3 size={20} />
            </div>

            <div>
              <span>Total Rows</span>
              <strong>
                {totalRows.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>


          <div className="dataset-stat-card">
            <div className="dataset-stat-icon orange">
              <Columns3 size={20} />
            </div>

            <div>
              <span>Data Source</span>
              <strong>
                {activeDataset ? 'Ready' : 'None'}
              </strong>
            </div>
          </div>

        </section>


        {/* UPLOAD */}

        <section className="upload-section">

          <div className="section-title">

            <div className="section-title-icon">
              <Upload size={19} />
            </div>

            <div>
              <h2>Upload Dataset</h2>

              <p>
                Add a CSV or Excel file to your MetricMind workspace.
              </p>
            </div>

          </div>


          <div
            className={`drop-zone ${
              dragActive ? 'drag-active' : ''
            } ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() =>
              !uploading &&
              fileInputRef.current?.click()
            }
          >

            <input
              ref={fileInputRef}
              id="dataset-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              hidden
            />

            {!file ? (
              <>
                <div className="upload-icon">
                  <Upload size={28} />
                </div>

                <h3>
                  Drop your dataset here
                </h3>

                <p>
                  or click to browse from your computer
                </p>

                <div className="supported-files">
                  <span>
                    <FileText size={14} />
                    CSV
                  </span>

                  <span>
                    <FileSpreadsheet size={14} />
                    XLSX
                  </span>

                  <span>
                    <FileSpreadsheet size={14} />
                    XLS
                  </span>
                </div>
              </>
            ) : (
              <div className="selected-file">

                <div className="selected-file-icon">
                  <FileText size={27} />
                </div>

                <div className="selected-file-info">
                  <strong>{file.name}</strong>

                  <span>
                    {formatFileSize(file.size)}
                  </span>
                </div>

                <div className="selected-file-check">
                  <CheckCircle size={22} />
                </div>

              </div>
            )}

          </div>


          {file && (
            <div className="upload-action-row">

              <button
                type="button"
                className="upload-button"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="spin"
                    />
                    Uploading {progress}%
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Upload Dataset
                  </>
                )}
              </button>

              <button
                type="button"
                className="cancel-file-button"
                onClick={() => {
                  setFile(null)
                  setProgress(0)

                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                disabled={uploading}
              >
                Cancel
              </button>

            </div>
          )}


          {uploading && (
            <div className="upload-progress">

              <div className="progress-top">
                <span>Uploading dataset...</span>
                <strong>{progress}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-value"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

            </div>
          )}


          {message && (
            <div className="status-message success">
              <CheckCircle size={18} />
              <span>{message}</span>
            </div>
          )}


          {error && (
            <div className="status-message error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

        </section>


        {/* ACTIVE DATASET */}

        {activeDataset && (
          <section className="active-dataset-card">

            <div className="active-left">

              <div className="active-icon">
                <Zap size={21} />
              </div>

              <div>
                <span className="active-label">
                  ACTIVE DATASET
                </span>

                <h3>
                  {activeDataset.name ||
                    activeDataset.original_filename}
                </h3>

                <p>
                  This dataset is currently powering your
                  MetricMind queries and analytics.
                </p>
              </div>

            </div>

            <div className="active-status">
              <span className="active-dot" />
              Live
            </div>

          </section>
        )}


        {/* DATASETS */}

        <section className="datasets-section">

          <div className="datasets-heading">

            <div>
              <h2>Your Datasets</h2>

              <p>
                Manage uploaded data sources and choose which
                dataset is active.
              </p>
            </div>

            <span className="dataset-count">
              {datasets.length} dataset
              {datasets.length !== 1 ? 's' : ''}
            </span>

          </div>


          {datasets.length === 0 ? (

            <div className="empty-datasets">

              <div className="empty-icon">
                <Database size={27} />
              </div>

              <h3>No datasets yet</h3>

              <p>
                Upload your first CSV or Excel file to start
                exploring your business data.
              </p>

            </div>

          ) : (

            <div className="dataset-list">

              {datasets.map((dataset) => {

                const columns = getColumns(dataset)

                const isSelected =
                  selectedDataset?.id === dataset.id

                const isActivating =
                  actionLoading ===
                  `activate-${dataset.id}`

                const isDeleting =
                  actionLoading ===
                  `delete-${dataset.id}`

                return (
                  <article
                    className={`dataset-card ${
                      dataset.is_active
                        ? 'active'
                        : ''
                    }`}
                    key={dataset.id}
                  >

                    <div className="dataset-card-main">

                      <div className="dataset-file-icon">
                        <FileText size={24} />
                      </div>

                      <div className="dataset-card-info">

                        <div className="dataset-name-row">

                          <h3>
                            {dataset.name ||
                              dataset.original_filename ||
                              'Unnamed Dataset'}
                          </h3>

                          {dataset.is_active && (
                            <span className="active-badge">
                              <Check size={12} />
                              Active
                            </span>
                          )}

                        </div>

                        <p className="dataset-filename">
                          {dataset.original_filename}
                        </p>

                        <div className="dataset-meta">

                          <span>
                            <Rows3 size={14} />
                            {Number(
                              dataset.row_count || 0
                            ).toLocaleString('en-IN')}{' '}
                            rows
                          </span>

                          <span>
                            <Columns3 size={14} />
                            {Number(
                              dataset.column_count || 0
                            ).toLocaleString('en-IN')}{' '}
                            columns
                          </span>

                          <span>
                            <HardDrive size={14} />
                            {formatFileSize(
                              dataset.file_size
                            )}
                          </span>

                          <span>
                            Uploaded{' '}
                            {formatDate(
                              dataset.uploaded_at
                            )}
                          </span>

                        </div>

                      </div>

                    </div>


                    <div className="dataset-card-actions">

                      <button
                        type="button"
                        className="details-button"
                        onClick={() =>
                          setSelectedDataset(
                            isSelected
                              ? null
                              : dataset
                          )
                        }
                      >
                        {isSelected
                          ? 'Hide details'
                          : 'View details'}
                      </button>


                      {!dataset.is_active && (
                        <button
                          type="button"
                          className="activate-button"
                          onClick={() =>
                            handleActivate(dataset)
                          }
                          disabled={
                            actionLoading !== null
                          }
                        >
                          {isActivating ? (
                            <RefreshCw
                              size={15}
                              className="spin"
                            />
                          ) : (
                            <Zap size={15} />
                          )}

                          {isActivating
                            ? 'Activating'
                            : 'Activate'}
                        </button>
                      )}


                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(dataset)
                        }
                        disabled={
                          actionLoading !== null
                        }
                        title="Delete dataset"
                      >
                        {isDeleting ? (
                          <RefreshCw
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>

                    </div>


                    {isSelected && (
                      <div className="dataset-details">

                        <div className="details-summary">

                          <div>
                            <span>File type</span>
                            <strong>
                              {dataset.file_type ||
                                'Unknown'}
                            </strong>
                          </div>

                          <div>
                            <span>Status</span>
                            <strong>
                              {dataset.upload_status ||
                                'Completed'}
                            </strong>
                          </div>

                          <div>
                            <span>Table</span>
                            <strong>
                              {dataset.table_name ||
                                'sales'}
                            </strong>
                          </div>

                        </div>


                        {columns.length > 0 && (
                          <div className="columns-preview">

                            <div className="columns-title">
                              <Columns3 size={16} />
                              Dataset columns
                            </div>

                            <div className="column-tags">

                              {columns
                                .slice(0, 30)
                                .map(
                                  (column, index) => (
                                    <span
                                      key={
                                        `${column}-${index}`
                                      }
                                    >
                                      {String(column)}
                                    </span>
                                  )
                                )}

                              {columns.length > 30 && (
                                <span>
                                  +
                                  {columns.length - 30}{' '}
                                  more
                                </span>
                              )}

                            </div>

                          </div>
                        )}

                      </div>
                    )}

                  </article>
                )
              })}

            </div>
          )}

        </section>

      </div>
    </div>
  )
}