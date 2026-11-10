#!/usr/bin/env node
/**
 * O estúdio de mockups como MCP local (stdio): o agente cria a cena e recebe o caminho do MP4/PNG.
 *
 *   claude mcp add mockup-estudio -- node Z:/Cursor/Vintageuiuxlibrary/scripts/mockup-agente/mcp.mjs
 *
 * Local de propósito: o render precisa de um Chrome e grava no disco de quem pediu.
 * O MCP remoto do catálogo (api/mcp.ts) continua só catálogo.
 */
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { criarCena, iniciarRender, lerRender } from "./cenas.mjs";
import { fechar, listarPresets, SpecCena } from "./motor.mjs";

const texto = (o) => ({ content: [{ type: "text", text: typeof o === "string" ? o : JSON.stringify(o, null, 2) }] });
const falha = (e) => ({ isError: true, content: [{ type: "text", text: e.name === "ZodError" ? JSON.stringify(e.issues) : e.message }] });

const server = new McpServer({ name: "mockup-estudio", version: "0.1.0" });

server.registerTool(
  "list_presets",
  {
    title: "Listar receitas e presets do estúdio",
    description:
      "Receitas de showreel (preset + pose + movimento prontos), presets visuais, poses por aparelho, movimentos de câmera, aparelhos e acabamentos. Leia antes de create_scene.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  },
  async () => {
    try {
      return texto(await listarPresets());
    } catch (e) {
      return falha(e);
    }
  },
);

server.registerTool(
  "create_scene",
  {
    title: "Criar cena de mockup",
    description:
      "Valida e guarda uma cena: arquivo (imagem ou vídeo) num aparelho (phone, tablet, laptop), com receita/preset, pose, movimento de câmera ou chaves (cenas marcadas), fundo e saída. Devolve o id e a cena resolvida. Saída padrão 16:9, 1920x1080, 30 fps.",
    inputSchema: SpecCena,
  },
  async (spec) => {
    try {
      return texto(await criarCena(spec));
    } catch (e) {
      return falha(e);
    }
  },
);

server.registerTool(
  "render_scene",
  {
    title: "Renderizar cena",
    description:
      "Renderiza uma cena criada (id) ou uma spec direta, pelo exportador do próprio estúdio: MP4 (H.264) do movimento e PNG do pôster. Com esperar=true (padrão) devolve os caminhos; senão devolve o id para get_render.",
    inputSchema: z.object({
      id: z.string().optional().describe("Id devolvido por create_scene."),
      spec: SpecCena.optional().describe("Ou a spec inteira, sem create_scene."),
      pasta: z.string().optional().describe("Pasta de saída (absoluta). Padrão: test-results/mockup-agente do repo."),
      esperar: z.boolean().optional(),
    }),
  },
  async ({ id, spec, pasta, esperar = true }) => {
    try {
      if (!id && !spec) throw new Error("Passe id ou spec.");
      if (spec) await criarCena(spec);
      const job = iniciarRender({ id, spec, pasta });
      if (esperar) await job.promessa;
      const r = lerRender(job.id);
      return r.status === "erro" ? falha(new Error(r.erro)) : texto(r);
    } catch (e) {
      return falha(e);
    }
  },
);

server.registerTool(
  "get_render",
  {
    title: "Status de um render",
    description: "Status (fila, renderizando, pronto, erro) e arquivos de um render iniciado com esperar=false.",
    inputSchema: z.object({ id: z.string() }),
    annotations: { readOnlyHint: true },
  },
  async ({ id }) => {
    try {
      return texto(lerRender(id));
    } catch (e) {
      return falha(e);
    }
  },
);

const transporte = new StdioServerTransport();
transporte.onclose = () => void fechar().then(() => process.exit(0));
await server.connect(transporte);
