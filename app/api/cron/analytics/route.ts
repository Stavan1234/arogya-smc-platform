import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), 'analytics', 'run_all.py');
    console.log(`Executing analytics script at: ${scriptPath}`);
    
    // Command to run the analytics Python script
    const venvPythonPath = path.join(process.cwd(), 'analytics_env', 'Scripts', 'python.exe');
    // Using simple python command, but we assume python/python3 is in PATH environment
    const pythonCmd = require('fs').existsSync(venvPythonPath) ? `"${venvPythonPath}"` : 'python';
    
    const { stdout, stderr } = await execAsync(`${pythonCmd} "${scriptPath}"`);
    
    console.log("Analytics script executed successfully");
    if (stderr) console.warn("Analytics stderr:", stderr);

    return NextResponse.json({
      success: true,
      message: 'Analytics completed successfully',
      output: stdout,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Failed to execute analytics script:", error);
    return NextResponse.json({
      success: false,
      message: 'Failed to execute analytics',
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}
