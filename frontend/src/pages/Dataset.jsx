import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Database,
  Trash2,
  RefreshCw,
} from 'lucide-react'

import { apiService } from '../services/api'

export default function DatasetUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [datasets, setDatasets] = useState([])
  const [activeDataset, setActiveDataset] = useState(null)
  const [loadingDatasets, setLoadingDatasets] = useState(true)

  // =====================================================
  // LOAD DATASETS
  // =====================================================

  const loadDatasets = async () => {
    try {
      setLoadingDatasets(true)
      setError('')

      const response = await apiService.getDatasets()

      setDatasets(
        response?.data?.datasets ||
        response?.data ||
        []
      )

      try {
        const activeResponse =
          await apiService.getActiveDataset()

        setActiveDataset(
          activeResponse?.data?.dataset ||
          activeResponse?.data ||
          null
        )
      } catch {
        setActiveDataset(null)
      }
    } catch (err) {
      console.error('Dataset loading error:', err)
      setError(
        err?.message ||
        'Unable to load datasets.'
      )
    } finally {
      setLoadingDatasets(false)
    }
  }

  useEffect(() => {
    loadDatasets()
  }, [])

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0]

    setMessage('')
    setError('')

    if (!selectedFile) {
      setFile(null)
      return
    }

    const allowedTypes = [
      '.csv',
      '.xlsx',
      '.xls',
    ]

    const fileName =
      selectedFile.name.toLowerCase()

    const validFile =
      allowedTypes.some((extension) =>
        fileName.endsWith(extension)
      )

    if (!validFile) {
      setError(
        'Please select a CSV, XLSX, or XLS file.'
      )
      setFile(null)
      return
    }

    const maxSize =
      50 * 1024 * 1024

    if (selectedFile.size > maxSize) {
      setError(
        'File size must be less than 50 MB.'
      )
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  // =====================================================
  // UPLOAD
  // =====================================================

  const handleUpload = async () => {
    if (!file) {
      setError(
        'Please select a dataset first.'
      )
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage('')
    setError('')

    try {
      // IMPORTANT:
      // This calls:
      // POST /api/datasets/upload
      const response =
        await apiService.uploadDataset(
          file,
          (event) => {
            if (event.total) {
              const percentage =
                Math.round(
                  (event.loaded /
                    event.total) *
                    100
                )

              setProgress(percentage)
            }
          }
        )

      const uploadedDataset =
        response?.data?.dataset ||
        response?.data

      setMessage(
        response?.data?.message ||
        'Dataset uploaded successfully.'
      )

      // Automatically activate uploaded dataset
      if (
        uploadedDataset?.id
      ) {
        try {
          await apiService.activateDataset(
            uploadedDataset.id
          )

          setActiveDataset(
            uploadedDataset
          )
        } catch (activationError) {
          console.error(
            'Activation error:',
            activationError
          )
        }
      }

      setFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await loadDatasets()
    } catch (err) {
      console.error(
        'Dataset upload error:',
        err
      )

      setError(
        err?.message ||
        'Dataset upload failed.'
      )
    } finally {
      setUploading(false)
    }
  }

  // =====================================================
  // ACTIVATE DATASET
  // =====================================================

  const handleActivate = async (
    datasetId
  ) => {
    try {
      setError('')
      setMessage('')

      await apiService.activateDataset(
        datasetId
      )

      setMessage(
        'Dataset activated successfully.'
      )

      await loadDatasets()
    } catch (err) {
      console.error(
        'Activation error:',
        err
      )

      setError(
        err?.message ||
        'Unable to activate dataset.'
      )
    }
  }

  // =====================================================
  // DELETE DATASET
  // =====================================================

  const handleDelete = async (
    datasetId
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this dataset?'
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setMessage('')

      await apiService.deleteDataset(
        datasetId
      )

      setMessage(
        'Dataset deleted successfully.'
      )

      await loadDatasets()
    } catch (err) {
      console.error(
        'Delete error:',
        err
      )

      setError(
        err?.message ||
        'Unable to delete dataset.'
      )
    }
  }

  // =====================================================
  // FORMAT FILE SIZE
  // =====================================================

  const formatSize = (bytes) => {
    if (!bytes) {
      return '0 KB'
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'var(--background)',
        color: 'var(--text)',
        padding: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 800,
              }}
            >
              Dataset Management
            </h1>

            <p
              style={{
                color: 'var(--muted)',
                marginTop: '8px',
              }}
            >
              Upload and manage your
              business datasets.
            </p>
          </div>

          <button
            onClick={() =>
              navigate('/')
            }
            style={{
              padding:
                '10px 18px',
              borderRadius: '10px',
              border:
                '1px solid var(--border)',
              background:
                'var(--surface)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            Dashboard
          </button>
        </div>

        {/* UPLOAD CARD */}

        <div
          style={{
            background:
              'var(--surface)',
            border:
              '1px solid var(--border)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Upload your dataset
          </h2>

          <p
            style={{
              color: 'var(--muted)',
            }}
          >
            Select a CSV, XLSX, or XLS
            file containing your
            business data.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={
              handleFileChange
            }
            style={{
              display: 'none',
            }}
          />

          <div
            onClick={() =>
              !uploading &&
              fileInputRef.current?.click()
            }
            style={{
              marginTop: '25px',
              border:
                '2px dashed var(--primary)',
              borderRadius: '18px',
              padding: '50px 20px',
              textAlign: 'center',
              cursor: uploading
                ? 'not-allowed'
                : 'pointer',
              background:
                'rgba(79,70,229,0.04)',
            }}
          >
            <Upload
              size={48}
              color="var(--primary)"
            />

            <h3>
              {file
                ? file.name
                : 'Choose a dataset'}
            </h3>

            <p
              style={{
                color: 'var(--muted)',
              }}
            >
              CSV, XLSX or XLS ·
              Maximum 50 MB
            </p>
          </div>

          {/* SELECTED FILE */}

          {file && (
            <div
              style={{
                marginTop: '20px',
                padding: '18px',
                borderRadius: '14px',
                background:
                  '#f0fdf4',
                border:
                  '1px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <FileText
                color="#15803d"
              />

              <div
                style={{
                  flex: 1,
                }}
              >
                <strong
                  style={{
                    color: '#166534',
                  }}
                >
                  {file.name}
                </strong>

                <div
                  style={{
                    color: '#166534',
                    marginTop: '4px',
                  }}
                >
                  {formatSize(
                    file.size
                  )}
                </div>
              </div>

              <CheckCircle
                color="#15803d"
              />
            </div>
          )}

          {/* PROGRESS */}

          {uploading && (
            <div
              style={{
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginBottom: '8px',
                }}
              >
                <span>
                  Uploading...
                </span>

                <span>
                  {progress}%
                </span>
              </div>

              <div
                style={{
                  height: '8px',
                  borderRadius: '10px',
                  background:
                    'var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background:
                      'var(--primary)',
                    transition:
                      'width 0.2s',
                  }}
                />
              </div>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '12px',
                background:
                  '#fef2f2',
                border:
                  '1px solid #fecaca',
                color: '#b91c1c',
                display: 'flex',
                gap: '10px',
                alignItems:
                  'center',
              }}
            >
              <XCircle size={20} />
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div
              style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '12px',
                background:
                  '#f0fdf4',
                border:
                  '1px solid #bbf7d0',
                color: '#166534',
                display: 'flex',
                gap: '10px',
                alignItems:
                  'center',
              }}
            >
              <CheckCircle
                size={20}
              />
              {message}
            </div>
          )}

          {/* UPLOAD BUTTON */}

          <button
            onClick={handleUpload}
            disabled={
              !file || uploading
            }
            style={{
              width: '100%',
              marginTop: '25px',
              padding: '15px',
              border: 'none',
              borderRadius: '12px',
              background:
                !file || uploading
                  ? '#94a3b8'
                  : 'var(--primary)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              cursor:
                !file || uploading
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: '10px',
            }}
          >
            {uploading ? (
              <>
                <RefreshCw
                  size={20}
                  className="spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <Database
                  size={20}
                />
                Upload Dataset
              </>
            )}
          </button>
        </div>

        {/* DATASETS */}

        <div
          style={{
            background:
              'var(--surface)',
            border:
              '1px solid var(--border)',
            borderRadius: '20px',
            padding: '30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              Your datasets
            </h2>

            <button
              onClick={
                loadDatasets
              }
              style={{
                padding:
                  '8px 12px',
                borderRadius:
                  '8px',
                border:
                  '1px solid var(--border)',
                background:
                  'var(--surface)',
                cursor:
                  'pointer',
              }}
            >
              <RefreshCw
                size={16}
              />
            </button>
          </div>

          {loadingDatasets ? (
            <p
              style={{
                color:
                  'var(--muted)',
              }}
            >
              Loading datasets...
            </p>
          ) : datasets.length ===
            0 ? (
            <p
              style={{
                color:
                  'var(--muted)',
              }}
            >
              No datasets uploaded
              yet.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '15px',
              }}
            >
              {datasets.map(
                (dataset) => {
                  const isActive =
                    dataset.is_active ||
                    activeDataset?.id ===
                      dataset.id

                  return (
                    <div
                      key={
                        dataset.id
                      }
                      style={{
                        padding:
                          '18px',
                        border:
                          '1px solid var(--border)',
                        borderRadius:
                          '14px',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '15px',
                      }}
                    >
                      <FileText
                        color="var(--primary)"
                      />

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <strong>
                          {dataset.name ||
                            dataset.original_filename}
                        </strong>

                        <div
                          style={{
                            color:
                              'var(--muted)',
                            marginTop:
                              '5px',
                            fontSize:
                              '14px',
                          }}
                        >
                          {dataset.row_count ??
                            0}{' '}
                          rows ·{' '}
                          {dataset.column_count ??
                            0}{' '}
                          columns
                        </div>
                      </div>

                      {isActive ? (
                        <span
                          style={{
                            padding:
                              '7px 12px',
                            borderRadius:
                              '20px',
                            background:
                              '#dcfce7',
                            color:
                              '#166534',
                            fontSize:
                              '13px',
                            fontWeight:
                              700,
                          }}
                        >
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            handleActivate(
                              dataset.id
                            )
                          }
                          style={{
                            padding:
                              '8px 12px',
                            borderRadius:
                              '8px',
                            border:
                              '1px solid var(--primary)',
                            background:
                              'var(--surface)',
                            color:
                              'var(--primary)',
                            cursor:
                              'pointer',
                          }}
                        >
                          Activate
                        </button>
                      )}

                      <button
                        onClick={() =>
                          handleDelete(
                            dataset.id
                          )
                        }
                        disabled={
                          isActive
                        }
                        title={
                          isActive
                            ? 'Active dataset cannot be deleted'
                            : 'Delete dataset'
                        }
                        style={{
                          border:
                            'none',
                          background:
                            'transparent',
                          color:
                            isActive
                              ? '#94a3b8'
                              : '#dc2626',
                          cursor:
                            isActive
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        <Trash2
                          size={20}
                        />
                      </button>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}