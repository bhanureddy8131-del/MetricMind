import { useEffect, useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'

export default function DatasetUpload() {
  const [file, setFile] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
    }
  }

  useEffect(() => {
    loadDatasets()
  }, [])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    setMessage('')
    setError('')
    setProgress(0)

    if (!selectedFile) {
      setFile(null)
      return
    }

    const validExtensions = ['.csv', '.xlsx', '.xls']
    const fileName = selectedFile.name.toLowerCase()

    const valid = validExtensions.some((extension) =>
      fileName.endsWith(extension)
    )

    if (!valid) {
      setError('Please select a CSV, XLSX, or XLS file.')
      setFile(null)
      return
    }

    setFile(selectedFile)
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
          if (event.total) {
            setProgress(
              Math.round((event.loaded / event.total) * 100)
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
      setMessage('Dataset uploaded successfully.')
      setFile(null)

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--text)',
        padding: '32px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <h1 style={{ marginBottom: '8px' }}>
          Dataset Management
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            marginBottom: '30px',
          }}
        >
          Upload and manage your MetricMind datasets.
        </p>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '30px',
            marginBottom: '30px',
          }}
        >
          <h2>Upload Dataset</h2>

          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '14px',
              padding: '40px',
              textAlign: 'center',
              marginTop: '20px',
            }}
          >
            <Upload
              size={45}
              style={{
                color: 'var(--primary)',
                marginBottom: '15px',
              }}
            />

            <h3>Select your dataset</h3>

            <p
              style={{
                color: 'var(--muted)',
              }}
            >
              Supported formats: CSV, XLSX, XLS
            </p>

            <input
              id="dataset-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ marginTop: '20px' }}
            />

            {file && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                }}
              >
                <FileText
                  size={20}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: '8px',
                  }}
                />

                {file.name}

                <div
                  style={{
                    color: 'var(--muted)',
                    marginTop: '5px',
                  }}
                >
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                marginTop: '25px',
                padding: '13px 28px',
                border: 'none',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: '700',
                cursor:
                  !file || uploading
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  !file || uploading ? 0.6 : 1,
              }}
            >
              {uploading
                ? `Uploading ${progress}%`
                : 'Upload Dataset'}
            </button>

            {uploading && (
              <div
                style={{
                  marginTop: '20px',
                  height: '8px',
                  background: 'var(--border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--primary)',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            )}

            {message && (
              <div
                style={{
                  marginTop: '20px',
                  color: '#16a34a',
                }}
              >
                <CheckCircle
                  size={20}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: '6px',
                  }}
                />
                {message}
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: '20px',
                  color: '#dc2626',
                }}
              >
                <AlertCircle
                  size={20}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: '6px',
                  }}
                />
                {error}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '30px',
          }}
        >
          <h2>Available Datasets</h2>

          {datasets.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>
              No datasets uploaded yet.
            </p>
          ) : (
            <div style={{ marginTop: '20px' }}>
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  style={{
                    padding: '18px',
                    borderBottom:
                      '1px solid var(--border)',
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>
                      {dataset.name ||
                        dataset.original_filename}
                    </strong>

                    <div
                      style={{
                        color: 'var(--muted)',
                        marginTop: '5px',
                      }}
                    >
                      {dataset.row_count || 0} rows
                      {' • '}
                      {dataset.column_count || 0}{' '}
                      columns
                    </div>
                  </div>

                  {dataset.is_active && (
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background:
                          'rgba(34,197,94,0.12)',
                        color: '#16a34a',
                        fontWeight: '700',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}