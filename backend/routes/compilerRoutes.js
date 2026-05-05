const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/verifytoken");

// Use free Compiler API - No signup, no API key needed
// API by thevip7 - https://compilerapi.onrender.com

// Supported Languages
const LANGUAGES = {
  python: { id: "py", name: "Python 3", extension: "py" },
  javascript: { id: "js", name: "JavaScript", extension: "js" },
  java: { id: "java", name: "Java", extension: "java" },
  cpp: { id: "cpp", name: "C++", extension: "cpp" },
  c: { id: "c", name: "C", extension: "c" },
  go: { id: "go", name: "Go", extension: "go" },
  ruby: { id: "rb", name: "Ruby", extension: "rb" },
  php: { id: "php", name: "PHP", extension: "php" }
};

// Default code templates
const DEFAULT_CODE_TEMPLATES = {
  python: `# Python 3 Code
print("Hello, World!")`,

  javascript: `// JavaScript Code
console.log("Hello, World!");`,

  java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,

  cpp: `// C++ Code
#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,

  c: `// C Code
#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,

  go: `// Go Code
package main
import "fmt"
func main() {
    fmt.Println("Hello, World!");
}`,

  ruby: `# Ruby Code
puts "Hello, World!"`,

  php: `<?php
echo "Hello, World!";
?>`
};

/* ================= EXECUTE CODE USING FREE COMPILER API ================= */
const executeWithCompilerAPI = async (code, language, stdin) => {
  try {
    const langConfig = LANGUAGES[language];
    if (!langConfig) {
      return { error: `Language ${language} not supported` };
    }
    
    // Map language to API format
    const languageMap = {
      python: "py",
      javascript: "js",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      ruby: "rb",
      php: "php"
    };
    
    const apiLanguage = languageMap[language];
    
    console.log(`Executing ${language} code with Compiler API...`);
    
    const response = await axios.post(
      "https://compilerapi.onrender.com/api/run",
      {
        code: code,
        language: apiLanguage,
        input: stdin || ""
      },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000  // 20 second timeout
      }
    );
    
    console.log("Compiler API response received");
    
    return {
      output: response.data.output || "",
      error: response.data.error || "",
      executionTime: response.data.executionTime || null,
      memory: null
    };
    
  } catch (error) {
    console.error("Compiler API error:", error.message);
    
    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED') {
      return { error: "Execution timeout. Code took too long to run." };
    }
    
    // Check if API is down
    if (error.response?.status === 404) {
      return { error: "Compiler API is temporarily unavailable. Please try again later." };
    }
    
    return { error: "Compilation service error: " + (error.response?.data?.message || error.message) };
  }
};

/* ================= COMPILE AND RUN CODE ================= */
router.post("/run", auth, async (req, res) => {
  try {
    const { code, language, stdin, expectedOutput } = req.body;
    const studentId = req.user.id;

    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: "Code and language are required" 
      });
    }

    console.log(`[${new Date().toISOString()}] Student ${studentId} running ${language} code`);
    
    const result = await executeWithCompilerAPI(code, language, stdin);
    
    const response = {
      success: true,
      output: result.output || "",
      error: result.error || "",
      executionTime: result.executionTime,
      memory: result.memory,
      status: result.error ? "Error" : "Success"
    };
    
    // Check if output matches expected output
    if (expectedOutput) {
      const isCorrect = (result.output || "").trim() === expectedOutput.trim();
      response.isCorrect = isCorrect;
      response.message = isCorrect 
        ? "✅ Correct answer!" 
        : "❌ Incorrect output.";
    }
    
    res.json(response);

  } catch (error) {
    console.error("Compilation error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to execute code. Please try again.",
      error: error.message
    });
  }
});

/* ================= RUN MULTIPLE TEST CASES ================= */
router.post("/test", auth, async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    
    if (!code || !language || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({ 
        success: false, 
        message: "Code, language, and test cases are required" 
      });
    }

    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await executeWithCompilerAPI(code, language, testCase.input);
      
      const output = result.output || "";
      const isPassed = (output.trim() === (testCase.expected || "").trim());
      
      results.push({
        testCase: i + 1,
        input: testCase.input,
        expected: testCase.expected,
        output: output,
        passed: isPassed,
        error: result.error || null,
        executionTime: result.executionTime
      });
    }
    
    const passedCount = results.filter(r => r.passed).length;
    
    res.json({
      success: true,
      results,
      summary: {
        total: testCases.length,
        passed: passedCount,
        failed: testCases.length - passedCount,
        score: (passedCount / testCases.length) * 100
      }
    });
    
  } catch (error) {
    console.error("Test execution error:", error);
    res.status(500).json({ success: false, message: "Failed to run test cases" });
  }
});

/* ================= SAVE CODE ================= */
router.post("/save", auth, async (req, res) => {
  try {
    const { code, language, problemId, subjectId } = req.body;
    const studentId = req.user.id;
    
    // You can save to database here if needed
    console.log(`[${new Date().toISOString()}] Student ${studentId} saved ${language} code`);
    
    res.json({ 
      success: true, 
      message: "Code saved successfully" 
    });
    
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ success: false, message: "Failed to save code" });
  }
});

/* ================= GET SUPPORTED LANGUAGES ================= */
router.get("/languages", auth, async (req, res) => {
  try {
    const languages = Object.entries(LANGUAGES).map(([key, value]) => ({
      id: value.id,
      key: key,
      name: value.name,
      extension: value.extension
    }));
    res.json({ success: true, languages });
  } catch (error) {
    console.error("Languages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= GET DEFAULT CODE TEMPLATE ================= */
router.get("/template/:language", auth, async (req, res) => {
  try {
    const { language } = req.params;
    const template = DEFAULT_CODE_TEMPLATES[language] || DEFAULT_CODE_TEMPLATES.python;
    res.json({ success: true, template });
  } catch (error) {
    console.error("Template error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;