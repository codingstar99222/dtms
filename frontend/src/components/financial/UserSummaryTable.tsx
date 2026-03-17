// frontend/src/components/financial/UserSummaryTable.tsx
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { UserFinancialSummary } from '../../services/financial.service';
import { formatCurrency } from '../../utils/formatters';

interface UserSummaryTableProps {
  summaries: UserFinancialSummary[];
}

const UserSummaryTable = ({ summaries }: UserSummaryTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell align="right">Income</TableCell>
            <TableCell align="right">Expenses</TableCell>
            <TableCell align="right">Net</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary.userId}>
              <TableCell>
                <Typography variant="body2">{summary.userName}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography color="success.main" fontWeight="medium">
                  {formatCurrency(summary.income)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography color="error.main" fontWeight="medium">
                  {formatCurrency(summary.expense)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  fontWeight="bold"
                  color={summary.net >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summary.net)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserSummaryTable;