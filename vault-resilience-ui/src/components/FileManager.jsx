import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileArchive,
  FileText,
  File,
  Search,
  ShieldCheck,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { uploadFile, downloadFile } from "../api";

function FileManager({ files = [], onRefresh }) {
  const fileInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState(null);

  const filteredFiles = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return files;

    return files.filter((file) =>
      String(file.name || file.file_id || "")
        .toLowerCase()
        .includes(query)
    );
  }, [files, search]);

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage(null);
    }, 3500);
  };

  const handleUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    try {
      setUploading(true);
      setMessage(null);

      await uploadFile(selectedFile);

      showMessage(
        "success",
        `${selectedFile.name} uploaded successfully`
      );

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      showMessage(
        "error",
        error.message || "Upload failed"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDownload = async (file) => {
    const fileId = file.file_id || file.name;

    if (!fileId) return;

    try {
      setDownloading(fileId);
      setMessage(null);

      await downloadFile(fileId);

      showMessage(
        "success",
        `${fileId} downloaded successfully`
      );
    } catch (error) {
      showMessage(
        "error",
        error.message || "Download failed"
      );
    } finally {
      setDownloading(null);
    }
  };

  const getFileIcon = (fileName) => {
    const name = String(fileName || "").toLowerCase();

    if (
      name.endsWith(".zip") ||
      name.endsWith(".rar") ||
      name.endsWith(".7z")
    ) {
      return <FileArchive size={20} />;
    }

    if (
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".pdf")
    ) {
      return <FileText size={20} />;
    }

    return <File size={20} />;
  };

  const getReplicaCount = (file) => {
    return (
      file.replication_factor ??
      file.replicas ??
      file.confirmed_nodes?.length ??
      0
    );
  };

  const getChecksum = (file) => {
    const checksum =
      file.checksum ||
      file.sha256 ||
      file.hash;

    if (!checksum) return "—";

    return `${String(checksum).slice(0, 10)}…`;
  };

  return (
    <section className="file-manager">

      {/* HEADER */}

      <div className="section-heading">
        <div>
          <span className="eyebrow">OBJECT STORAGE</span>

          <h2>File Manager</h2>

          <p>
            Upload, inspect and retrieve distributed objects
          </p>
        </div>

        <motion.button
          className="upload-button"
          whileHover={{
            scale: 1.04,
          }}
          whileTap={{
            scale: 0.96,
          }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2
                size={17}
                className="spin"
              />
              UPLOADING
            </>
          ) : (
            <>
              <Upload size={17} />
              UPLOAD OBJECT
            </>
          )}
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleUpload}
        />
      </div>

      {/* TOAST */}

      <AnimatePresence>
        {message && (
          <motion.div
            className={`file-message ${message.type}`}
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.96,
            }}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={17} />
            ) : (
              <XCircle size={17} />
            )}

            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH */}

      <div className="file-toolbar">
        <div className="file-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search objects..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="file-count">
          {filteredFiles.length} OBJECT
          {filteredFiles.length !== 1 ? "S" : ""}
        </div>
      </div>

      {/* FILE LIST */}

      <div className="file-list">

        <AnimatePresence mode="popLayout">

          {filteredFiles.map((file, index) => {
            const fileId =
              file.file_id || file.name;

            return (
              <motion.div
                key={fileId || index}
                className="file-row"
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.04,
                }}
                layout
              >

                {/* FILE */}

                <div className="file-info">

                  <motion.div
                    className="file-icon"
                    whileHover={{
                      rotate: 5,
                      scale: 1.08,
                    }}
                  >
                    {getFileIcon(fileId)}
                  </motion.div>

                  <div>
                    <strong>
                      {fileId || "Unknown object"}
                    </strong>

                    <span>
                      {file.size ||
                        file.file_size ||
                        "Size unavailable"}
                    </span>
                  </div>

                </div>

                {/* REPLICAS */}

                <div className="file-property">
                  <span>REPLICAS</span>

                  <strong>
                    {getReplicaCount(file)}×
                  </strong>
                </div>

                {/* INTEGRITY */}

                <div className="file-property integrity">

                  <span>SHA-256</span>

                  <strong>
                    <ShieldCheck size={14} />

                    {getChecksum(file)}
                  </strong>

                </div>

                {/* DOWNLOAD */}

                <motion.button
                  className="download-button"
                  onClick={() =>
                    handleDownload(file)
                  }
                  disabled={
                    downloading === fileId
                  }
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                >
                  {downloading === fileId ? (
                    <Loader2
                      size={17}
                      className="spin"
                    />
                  ) : (
                    <Download size={17} />
                  )}
                </motion.button>

              </motion.div>
            );
          })}

        </AnimatePresence>

        {/* EMPTY STATE */}

        {filteredFiles.length === 0 && (
          <motion.div
            className="empty-files"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
          >
            <File size={32} />

            <strong>
              {search
                ? "No matching objects"
                : "No objects stored"}
            </strong>

            <span>
              {search
                ? "Try another search query"
                : "Upload your first object to begin"}
            </span>
          </motion.div>
        )}

      </div>
    </section>
  );
}

export default FileManager;