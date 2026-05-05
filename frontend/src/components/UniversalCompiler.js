import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPlay,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiTerminal,
  FiCode,
  FiSave,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiTrash2,
  FiCopy,
  FiDownload
} from "react-icons/fi";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Default code templates
const DEFAULT_CODE_TEMPLATES = {
  python: `# Python 3 Code
def solution():
    # Write your code here
    return "Hello, World!"

# Test your solution
print(solution())`,

  javascript: `// JavaScript (Node.js) Code
function solution() {
    // Write your code here
    return "Hello, World!";
}

// Test your solution
console.log(solution());`,

  java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println(solution());
    }
    
    public static String solution() {
        // Write your code here
        return "Hello, World!";
    }
}`,

  cpp: `// C++ Code
#include <iostream>
#include <string>
using namespace std;

string solution() {
    // Write your code here
    return "Hello, World!";
}

int main() {
    cout << solution() << endl;
    return 0;
}`,

  c: `// C Code
#include <stdio.h>
#include <string.h>

char* solution() {
    // Write your code here
    return "Hello, World!";
}

int main() {
    printf("%s\\n", solution());
    return 0;
}`,

  go: `// Go Code
package main

import "fmt"

func solution() string {
    // Write your code here
    return "Hello, World!"
}

func main() {
    fmt.Println(solution())
}`,

  rust: `// Rust Code
fn solution() -> String {
    // Write your code here
    "Hello, World!".to_string()
}

fn main() {
    println!("{}", solution());
}`,

  ruby: `# Ruby Code
def solution
    # Write your code here
    "Hello, World!"
end

puts solution`,

  php: `<?php
function solution() {
    // Write your code here
    return "Hello, World!";
}

echo solution();
?>`,

  typescript: `// TypeScript Code
function solution(): string {
    // Write your code here
    return "Hello, World!";
}

console.log(solution());`,

  csharp: `// C# Code
using System;

class Program {
    static string Solution() {
        // Write your code here
        return "Hello, World!";
    }
    
    static void Main() {
        Console.WriteLine(Solution());
    }
}`
};

// Language options with icons
const LANGUAGES = [
  { key: "python", name: "Python 3", icon: "🐍", color: "#3776AB", defaultCode: DEFAULT_CODE_TEMPLATES.python },
  { key: "javascript", name: "JavaScript", icon: "🟨", color: "#F7DF1E", defaultCode: DEFAULT_CODE_TEMPLATES.javascript },
  { key: "java", name: "Java", icon: "☕", color: "#007396", defaultCode: DEFAULT_CODE_TEMPLATES.java },
  { key: "cpp", name: "C++", icon: "⚡", color: "#00599C", defaultCode: DEFAULT_CODE_TEMPLATES.cpp },
  { key: "c", name: "C", icon: "🔵", color: "#A8B9CC", defaultCode: DEFAULT_CODE_TEMPLATES.c },
  { key: "go", name: "Go", icon: "🔷", color: "#00ADD8", defaultCode: DEFAULT_CODE_TEMPLATES.go },
  { key: "rust", name: "Rust", icon: "🦀", color: "#CE412B", defaultCode: DEFAULT_CODE_TEMPLATES.rust },
  { key: "ruby", name: "Ruby", icon: "💎", color: "#CC342D", defaultCode: DEFAULT_CODE_TEMPLATES.ruby },
  { key: "php", name: "PHP", icon: "🐘", color: "#777BB4", defaultCode: DEFAULT_CODE_TEMPLATES.php },
  { key: "typescript", name: "TypeScript", icon: "📘", color: "#3178C6", defaultCode: DEFAULT_CODE_TEMPLATES.typescript },
  { key: "csharp", name: "C#", icon: "🎯", color: "#68217A", defaultCode: DEFAULT_CODE_TEMPLATES.csharp }
];

const UniversalCompiler = ({ initialCode, initialLanguage, onRunComplete, darkMode }) => {
  const [code, setCode] = useState(initialCode || DEFAULT_CODE_TEMPLATES.python);
  const [language, setLanguage] = useState(initialLanguage || "python");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [memory, setMemory] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [showTestCases, setShowTestCases] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    const langConfig = LANGUAGES.find(l => l.key === newLanguage);
    if (langConfig) {
      setCode(langConfig.defaultCode);
    }
    setOutput("");
    setError("");
    setExecutionTime(null);
    setMemory(null);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    setExecutionTime(null);
    setMemory(null);

    try {
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);
      
      if (!token) {
        setError("Authentication required. Please login again.");
        toast.error("Please login again");
        setIsRunning(false);
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/compiler/run`,
        { code, language, stdin },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        if (response.data.output) {
          setOutput(response.data.output);
        }
        if (response.data.error) {
          setError(response.data.error);
        }
        if (response.data.executionTime) {
          setExecutionTime(response.data.executionTime);
        }
        if (response.data.memory) {
          setMemory(response.data.memory);
        }
        
        if (onRunComplete) {
          onRunComplete(response.data);
        }
        
        toast.success("Code executed successfully!");
      } else {
        setError(response.data.message || "Compilation failed");
        toast.error(response.data.message || "Compilation failed");
      }
    } catch (err) {
      console.error("Error running code:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please logout and login again.");
        toast.error("Session expired. Please login again.");
      } else {
        setError(err.response?.data?.message || "Failed to execute code");
        toast.error("Failed to execute code");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const runTestCases = async () => {
    if (testCases.length === 0) {
      toast.warning("Please add test cases first");
      return;
    }
    
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication required. Please login again.");
        setIsRunning(false);
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/compiler/test`,
        { code, language, testCases },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setTestResults(response.data.results);
        
        const passed = response.data.summary.passed;
        const total = response.data.summary.total;
        
        if (passed === total) {
          toast.success(`🎉 All ${total} test cases passed!`);
        } else {
          toast.warning(`${passed}/${total} test cases passed`);
        }
      }
    } catch (err) {
      console.error("Error running tests:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to run test cases");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected: "" }]);
  };

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const saveCode = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }
      
      await axios.post(
        `${API_BASE_URL}/compiler/save`,
        { code, language },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success("Code saved successfully!");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to save code");
      }
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const resetCode = () => {
    const langConfig = LANGUAGES.find(l => l.key === language);
    setCode(langConfig?.defaultCode || DEFAULT_CODE_TEMPLATES.python);
    setOutput("");
    setError("");
    setStdin("");
    toast.info("Code reset to default template");
  };

  const downloadCode = () => {
    const langConfig = LANGUAGES.find(l => l.key === language);
    const extension = langConfig?.key === "javascript" ? "js" : 
                      langConfig?.key === "cpp" ? "cpp" :
                      langConfig?.key === "csharp" ? "cs" :
                      langConfig?.key === "typescript" ? "ts" :
                      langConfig?.key;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const getLanguageColor = () => {
    const lang = LANGUAGES.find(l => l.key === language);
    return lang?.color || "#667eea";
  };

  const getLanguageIcon = () => {
    const lang = LANGUAGES.find(l => l.key === language);
    return lang?.icon || "💻";
  };

  return (
    <div style={styles.container}>
      <ToastContainer />
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <FiCode size={20} color={getLanguageColor()} />
          <span style={styles.headerTitle}>Code Compiler</span>
          <span style={styles.languageBadge}>
            {getLanguageIcon()} {LANGUAGES.find(l => l.key === language)?.name}
          </span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} onClick={copyCode} title="Copy Code">
            <FiCopy size={16} />
          </button>
          <button style={styles.iconBtn} onClick={downloadCode} title="Download Code">
            <FiDownload size={16} />
          </button>
          <button style={styles.iconBtn} onClick={resetCode} title="Reset Code">
            <FiRefreshCw size={16} />
          </button>
          <button style={styles.saveBtn} onClick={saveCode}>
            <FiSave size={16} /> Save
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Left Panel - Code Editor */}
        <div style={styles.editorPanel}>
          {/* Language Selector */}
          <div style={styles.languageBar}>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={styles.languageSelect}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.key} value={lang.key}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Monaco Editor */}
          <div style={styles.editorWrapper}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                wordWrap: "on",
                formatOnPaste: true,
                formatOnType: true
              }}
            />
          </div>
        </div>

        {/* Right Panel - Input/Output */}
        <div style={styles.outputPanel}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(!showTestCases && styles.activeTab) }}
              onClick={() => setShowTestCases(false)}
            >
              <FiTerminal size={14} /> Console
            </button>
            <button
              style={{ ...styles.tab, ...(showTestCases && styles.activeTab) }}
              onClick={() => setShowTestCases(true)}
            >
              <FiCheckCircle size={14} /> Test Cases ({testCases.length})
            </button>
          </div>

          {/* Console View */}
          {!showTestCases && (
            <div style={styles.consoleView}>
              {/* Input Section */}
              <div style={styles.inputSection}>
                <div 
                  style={styles.sectionHeader}
                  onClick={() => setShowStdin(!showStdin)}
                >
                  <span>Input (stdin)</span>
                  {showStdin ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </div>
                {showStdin && (
                  <textarea
                    style={styles.stdinTextarea}
                    placeholder="Enter custom input here..."
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    rows={3}
                  />
                )}
              </div>

              {/* Output Section */}
              <div style={styles.outputSection}>
                <div style={styles.sectionHeader}>Output</div>
                <div style={styles.outputArea}>
                  {error ? (
                    <pre style={styles.errorOutput}>{error}</pre>
                  ) : output ? (
                    <pre style={styles.successOutput}>{output}</pre>
                  ) : (
                    <div style={styles.placeholderOutput}>
                      Run your code to see output here
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Info */}
              {(executionTime || memory) && (
                <div style={styles.executionInfo}>
                  {executionTime && <span>⏱️ Time: {executionTime} ms</span>}
                  {memory && <span>💾 Memory: {memory} MB</span>}
                </div>
              )}

              {/* Run Button */}
              <button
                style={styles.runBtn}
                onClick={runCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <div style={styles.smallSpinner} />
                    Running...
                  </>
                ) : (
                  <>
                    <FiPlay size={16} /> Run Code
                  </>
                )}
              </button>
            </div>
          )}

          {/* Test Cases View */}
          {showTestCases && (
            <div style={styles.testCasesView}>
              <div style={styles.testCasesHeader}>
                <span>Test Cases</span>
                <button style={styles.addTestCaseBtn} onClick={addTestCase}>
                  <FiPlus size={14} /> Add Test Case
                </button>
              </div>
              
              <div style={styles.testCasesList}>
                {testCases.map((testCase, idx) => (
                  <div key={idx} style={styles.testCaseCard}>
                    <div style={styles.testCaseHeader}>
                      <span>Test Case {idx + 1}</span>
                      <button
                        style={styles.removeTestCaseBtn}
                        onClick={() => removeTestCase(idx)}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <div style={styles.testCaseInputWrapper}>
                      <label style={styles.testCaseLabel}>Input:</label>
                      <textarea
                        style={styles.testCaseTextarea}
                        value={testCase.input}
                        onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                        placeholder="Enter input for this test case"
                        rows={2}
                      />
                    </div>
                    <div style={styles.testCaseExpectedWrapper}>
                      <label style={styles.testCaseLabel}>Expected Output:</label>
                      <textarea
                        style={styles.testCaseTextarea}
                        value={testCase.expected}
                        onChange={(e) => updateTestCase(idx, "expected", e.target.value)}
                        placeholder="Enter expected output"
                        rows={2}
                      />
                    </div>
                    {testResults[idx] && (
                      <div style={testResults[idx].passed ? styles.testPassed : styles.testFailed}>
                        {testResults[idx].passed ? (
                          <><FiCheckCircle size={14} /> Passed!</>
                        ) : (
                          <><FiXCircle size={14} /> Failed</>
                        )}
                        {testResults[idx].output && (
                          <div style={styles.testOutput}>Output: {testResults[idx].output}</div>
                        )}
                        {testResults[idx].error && (
                          <div style={styles.testError}>Error: {testResults[idx].error}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {testCases.length > 0 && (
                <button
                  style={styles.runTestsBtn}
                  onClick={runTestCases}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <div style={styles.smallSpinner} />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <FiPlay size={16} /> Run All Test Cases
                    </>
                  )}
                </button>
              )}
              
              {/* Test Results Summary */}
              {testResults.length > 0 && (
                <div style={styles.testSummary}>
                  <h4>Test Results Summary</h4>
                  <div style={styles.summaryStats}>
                    <div style={styles.summaryStat}>
                      <span>✅ Passed:</span>
                      <strong>{testResults.filter(r => r.passed).length}</strong>
                    </div>
                    <div style={styles.summaryStat}>
                      <span>❌ Failed:</span>
                      <strong>{testResults.filter(r => !r.passed).length}</strong>
                    </div>
                    <div style={styles.summaryStat}>
                      <span>📊 Score:</span>
                      <strong>
                        {Math.round((testResults.filter(r => r.passed).length / testResults.length) * 100)}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: "#1E1E1E",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #333",
    marginBottom: "24px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "#252526",
    borderBottom: "1px solid #333"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#CCC"
  },
  languageBadge: {
    padding: "4px 10px",
    background: "#3C3C3C",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#CCC"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  iconBtn: {
    background: "#3C3C3C",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    color: "#CCC",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease"
  },
  saveBtn: {
    background: "#667eea",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "500"
  },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 450px",
    minHeight: "600px"
  },
  editorPanel: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #333"
  },
  languageBar: {
    padding: "12px",
    background: "#252526",
    borderBottom: "1px solid #333"
  },
  languageSelect: {
    background: "#3C3C3C",
    color: "white",
    border: "1px solid #555",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    width: "200px"
  },
  editorWrapper: {
    height: "calc(600px - 45px)",
    overflow: "hidden"
  },
  outputPanel: {
    display: "flex",
    flexDirection: "column",
    background: "#1E1E1E"
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #333",
    background: "#252526"
  },
  tab: {
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    color: "#999",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    transition: "all 0.2s ease"
  },
  activeTab: {
    color: "#667eea",
    borderBottom: "2px solid #667eea"
  },
  consoleView: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1
  },
  inputSection: {
    background: "#252526",
    borderRadius: "8px",
    overflow: "hidden"
  },
  sectionHeader: {
    padding: "10px 12px",
    background: "#2D2D2D",
    fontSize: "12px",
    fontWeight: "600",
    color: "#CCC",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  stdinTextarea: {
    width: "100%",
    padding: "12px",
    background: "#1E1E1E",
    border: "none",
    color: "#CCC",
    fontFamily: "monospace",
    fontSize: "13px",
    resize: "vertical",
    outline: "none"
  },
  outputSection: {
    flex: 1,
    background: "#252526",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  outputArea: {
    flex: 1,
    padding: "12px",
    minHeight: "150px",
    maxHeight: "250px",
    overflow: "auto"
  },
  errorOutput: {
    color: "#EF4444",
    margin: 0,
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    fontFamily: "monospace"
  },
  successOutput: {
    color: "#10B981",
    margin: 0,
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    fontFamily: "monospace"
  },
  placeholderOutput: {
    color: "#666",
    fontSize: "12px",
    textAlign: "center",
    padding: "20px"
  },
  executionInfo: {
    display: "flex",
    gap: "16px",
    padding: "8px 12px",
    background: "#252526",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#888"
  },
  runBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    background: "#10B981",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  testCasesView: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    overflow: "auto"
  },
  testCasesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  addTestCaseBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "#667eea",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontSize: "12px",
    cursor: "pointer"
  },
  testCasesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "350px",
    overflow: "auto"
  },
  testCaseCard: {
    background: "#252526",
    borderRadius: "8px",
    padding: "12px",
    border: "1px solid #333"
  },
  testCaseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  removeTestCaseBtn: {
    background: "none",
    border: "none",
    color: "#EF4444",
    cursor: "pointer"
  },
  testCaseInputWrapper: {
    marginBottom: "10px"
  },
  testCaseExpectedWrapper: {
    marginBottom: "10px"
  },
  testCaseLabel: {
    display: "block",
    fontSize: "11px",
    color: "#999",
    marginBottom: "4px"
  },
  testCaseTextarea: {
    width: "100%",
    padding: "8px",
    background: "#1E1E1E",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#CCC",
    fontSize: "12px",
    fontFamily: "monospace",
    resize: "vertical"
  },
  testPassed: {
    padding: "8px",
    background: "#10B98120",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#10B981",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  testFailed: {
    padding: "8px",
    background: "#EF444420",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#EF4444",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap"
  },
  testOutput: {
    width: "100%",
    marginTop: "4px",
    fontSize: "11px",
    color: "#CCC"
  },
  testError: {
    width: "100%",
    marginTop: "4px",
    fontSize: "11px",
    color: "#EF4444"
  },
  runTestsBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    background: "#667eea",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer"
  },
  testSummary: {
    background: "#252526",
    borderRadius: "8px",
    padding: "12px",
    marginTop: "8px"
  },
  summaryStats: {
    display: "flex",
    gap: "20px",
    marginTop: "8px"
  },
  summaryStat: {
    display: "flex",
    gap: "8px",
    fontSize: "13px"
  },
  smallSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite"
  }
};

// Add keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default UniversalCompiler;