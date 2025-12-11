import { execSync } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";

function getOs(): string {
	const platform = os.platform();
	switch (platform) {
		case "darwin":
			return "macos";
		case "linux":
			try {
				execSync("ls -l /lib | grep libc.musl", { stdio: "pipe" });
				return "linux-musl";
			} catch (_error) {
				// command failed, so not musl
				return "linux-gnu";
			}
		default:
			throw new Error(`Unsupported OS type: ${platform}`);
	}
}

function getArch(): string {
	switch (os.arch()) {
		case "arm64":
		case "arm":
			return "aarch64";
		case "x64":
			return "x86_64";
		default:
			throw new Error(`Unsupported architecture: ${os.arch()}`);
	}
}

function isVersionLt(ver: string, compareTo: string): boolean {
	const versionParts = ver.split("-")[0].split(".").map(Number);
	const compareToParts = compareTo.split(".").map(Number);

	for (
		let i = 0;
		i < Math.max(versionParts.length, compareToParts.length);
		i++
	) {
		const v1 = versionParts[i] || 0;
		const v2 = compareToParts[i] || 0;
		if (v1 < v2) return true;
		if (v1 > v2) return false;
	}
	return false;
}

async function checkUrlExists(url: string): Promise<boolean> {
	const http = new HttpClient("setup-amber");
	try {
		const response = await http.head(url);
		return response.message.statusCode === 200;
	} catch (_error) {
		return false;
	} finally {
		http.dispose();
	}
}

async function run(): Promise<void> {
	try {
		const amberVersion = core.getInput("amber-version");
		const binPath =
			core.getInput("bin-path") || path.join(os.homedir(), ".local", "bin");
		const enableCache = core.getBooleanInput("enable-cache");

		let amberPath = "";
		if (enableCache) {
			amberPath = tc.find("amber", amberVersion, getArch());
		}

		if (amberPath) {
			core.info(`Found amber ${amberVersion} in cache at ${amberPath}`);
		} else {
			core.info(`Amber ${amberVersion} not found in cache, downloading...`);
			const platform = getOs();
			const arch = getArch();

			const isLegacy = isVersionLt(amberVersion, "0.5.0");
			let filename: string;
			let binaryInSubdir: boolean;
			if (isLegacy) {
				filename = `amber-${arch}-`;
				if (platform === "linux-gnu" || platform === "linux-musl") {
					filename += `unknown-${platform}`;
				} else {
					filename += "apple-darwin";
				}
				binaryInSubdir = true;
			} else {
				filename = `amber-${platform}-${arch}`;
				binaryInSubdir = false;
			}

			const downloadUrl = `https://github.com/amber-lang/amber/releases/download/${amberVersion}/${filename}.tar.xz`;

			if (!(await checkUrlExists(downloadUrl))) {
				throw new Error(
					`Release file not found at ${downloadUrl}. Please check if version ${amberVersion} exists and is available for your platform (${platform}, ${arch}).`,
				);
			}

			core.info(`Downloading from ${downloadUrl}`);
			const tarballPath = await tc.downloadTool(downloadUrl);
			const extractedPath = await tc.extractTar(tarballPath, undefined, ["-x"]);

			const binarySource = binaryInSubdir
				? path.join(extractedPath, filename, "amber")
				: path.join(extractedPath, "amber");

			if (enableCache) {
				amberPath = await tc.cacheFile(
					binarySource,
					"amber",
					"amber",
					amberVersion,
					getArch(),
				);
			} else {
				amberPath = path.dirname(binarySource);
			}
		}

		await io.mkdirP(binPath);
		await io.cp(path.join(amberPath, "amber"), path.join(binPath, "amber"));
		core.info(`Successfully installed amber ${amberVersion} to ${binPath}`);
		core.addPath(binPath);
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
		} else {
			core.setFailed(`An unknown error occurred: ${error}`);
		}
	}
}

run();
