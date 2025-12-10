import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { RELATORIOS } from "./config";

export const RelatoriosPage = () => {
  const navigate = useNavigate();

  return (
    <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}>
      {RELATORIOS.map((relatorio) => (
        <Card key={relatorio.slug} sx={{ borderRadius: 4 }}>
          <CardActionArea
            sx={{ height: "100%" }}
            onClick={() => navigate(`/relatorios/${relatorio.slug}`)}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600}>
                {relatorio.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {relatorio.description}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};
