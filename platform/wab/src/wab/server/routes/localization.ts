import { Request, Response } from "express-serve-static-core";
import { getConnection } from "typeorm";
import { ensureArray } from "../../common";
import { BadRequestError } from "../../shared/ApiErrors/errors";
import { ProjectId } from "../../shared/ApiSchema";
import {
  getResolvedProjectVersions,
  mkVersionToSync,
  parseProjectIdSpec,
  resolveProjectDeps,
} from "../loader/resolve-projects";
import { withSpan } from "../util/apm-util";
import { userDbMgr } from "./util";

export async function genTranslatableStrings(req: Request, res: Response) {
  const mgr = userDbMgr(req);
  const preview = !!(req.query.preview && req.query.preview !== "false");
  const format = req.query.format as "po" | "json" | "lingui";

  if (
    req.query.keyScheme &&
    !["content", "hash", "path"].includes(req.query.keyScheme as string)
  ) {
    throw new BadRequestError(`Invalid keyScheme ${req.query.keyScheme}`);
  }

  const keyScheme = (req.query.keyScheme ?? "content") as "content" | "hash";
  const tagPrefix = req.query.tagPrefix as string | undefined;
  const excludeDeps = req.query.excludeDeps === "true";
  const unresolvedProjectIdSpecs = ensureArray(req.query.projectId) as string[];

  const getResolvedProjectVersionsPreview = async (specs: string[]) => {
    return specs.map((s) => {
      if (!s.includes("@")) {
        return s;
      } else {
        const [projectId, version] = s.split("@");
        return `${projectId}@${version === "main" ? "latest" : version}`;
      }
    });
  };

  const projectIdSpecs = preview
    ? await getResolvedProjectVersionsPreview(unresolvedProjectIdSpecs)
    : await getResolvedProjectVersions(mgr, unresolvedProjectIdSpecs, {
        prefilledOnly: true,
      });

  const projectVersions = Object.fromEntries(
    projectIdSpecs
      .map(parseProjectIdSpec)
      .map(({ projectId, version, tag }) => {
        return [
          projectId,
          version == null
            ? mkVersionToSync(tag ?? "latest")
            : mkVersionToSync(version),
        ];
      })
  );

  await Promise.all(
    Object.keys(projectVersions).map((projectId) =>
      mgr.checkProjectPerms(projectId, "viewer", "get")
    )
  );

  const allProjectVersions = {
    // Get the resolved deps from seed projectIds
    ...(excludeDeps ? {} : await resolveProjectDeps(mgr, projectVersions)),
    ...projectVersions,
  };

  const stringsByProject = await withSpan(
    "localization-strings",
    async () =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(allProjectVersions).map(async ([projectId, v]) => {
            return [
              v.version === "latest" ? projectId : `${projectId}@${v.version}`,
              await req.workerpool.exec("localization-strings", [
                {
                  connectionOptions: getConnection().options,
                  projectId: projectId as ProjectId,
                  maybeVersion: v.version === "latest" ? undefined : v.version,
                  keyScheme,
                  tagPrefix,
                },
              ]),
            ] as const;
          })
        )
      ),
    `Localization strings for projects ${JSON.stringify(projectVersions)}`
  );

  res.json(formatLocalizationStrings(stringsByProject, format));
}

function formatLocalizationStrings(
  stringsByProject: Record<string, Record<string, string>>,
  format: "po" | "json" | "lingui"
) {
  if (format === "lingui") {
    /**
     * {
     *  "MessageID": {
     *    "translation": "Translated Message",
     *  }
     * }
     */
    return JSON.stringify(
      Object.fromEntries(
        Object.values(stringsByProject)
          .flatMap((msgs) => Object.entries(msgs))
          .map(([key, msg]) => [key, { translation: msg }])
      ),
      undefined,
      2
    );
  } else if (format === "po") {
    /**
     * #. Extracted comments (from dev to translator)
     * msgid "messageId"
     * msgstr "Translated Message"
     */
    return Object.entries(stringsByProject)
      .map(([projectId, msgs]) =>
        Object.entries(msgs)
          .map(
            ([key, msg]) =>
              `#. Auto-generated by Plasmic from project ${projectId}:\n` +
              `msgid ${JSON.stringify(key)}\n` +
              `msgstr ${JSON.stringify(msg)}\n`
          )
          .join("\n")
      )
      .join("");
  } else {
    /** Simple JSON
     * {
     *  "MessageID": "Translated Message",
     * }
     */
    return JSON.stringify(
      Object.fromEntries(
        Object.values(stringsByProject)
          .flatMap((msgs) => Object.entries(msgs))
          .map(([key, msg]) => [key, msg])
      ),
      undefined,
      2
    );
  }
}
