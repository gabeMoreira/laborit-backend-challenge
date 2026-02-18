import { Router } from "express";
import { z } from "zod";
import { runQuestion } from "../services/queryService.js";

const router = Router();

const bodySchema = z.object({
  question: z.string().min(3),
  includeSql: z.boolean().optional()
});

/**
 * @openapi
 * /query:
 *   post:
 *     summary: Convert a natural-language question into SQL and return the result.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               includeSql:
 *                 type: boolean
 *             required:
 *               - question
 *           examples:
 *             produtosMaisVendidos:
 *               summary: Produtos mais vendidos
 *               value:
 *                 question: "Quais são os produtos mais vendidos em termos de quantidade?"
 *                 includeSql: true
 *             volumePorCidade:
 *               summary: Volume de vendas por cidade
 *               value:
 *                 question: "Qual é o volume de vendas por cidade?"
 *                 includeSql: true
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   type: string
 *                 sql:
 *                   type: string
 *                 explanation:
 *                   type: string
 *                 rows:
 *                   type: array
 *                   items:
 *                     type: object
 *             examples:
 *               respostaProdutosMaisVendidos:
 *                 summary: Exemplo de resposta
 *                 value:
 *                   question: "Quais são os produtos mais vendidos em termos de quantidade?"
 *                   sql: "SELECT p.ProductName, SUM(od.Quantity) AS TotalQuantity FROM order_details od JOIN products p ON p.ProductID = od.ProductID GROUP BY p.ProductName ORDER BY TotalQuantity DESC LIMIT 10"
 *                   explanation: "Somatório da quantidade por produto, ordenando do maior para o menor."
 *                   rows:
 *                     - ProductName: "Côte de Blaye"
 *                       TotalQuantity: 1040
 *                     - ProductName: "Raclette Courdavault"
 *                       TotalQuantity: 990
 */
router.post("/query", async (req, res, next) => {
  try {
    const { question, includeSql } = bodySchema.parse(req.body);
    const result = await runQuestion(question);

    res.json({
      question,
      sql: includeSql === false ? undefined : result.sql,
      explanation: result.explanation,
      rows: result.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
