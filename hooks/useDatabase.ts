'use client';

import { useEffect, useState } from 'react';
import type { Column, Row, SearchMode, TableInfo } from '@/components/types';

const PAGE_SIZE = 50;

export function useDatabase() {
  const [databasePath, setDatabasePath] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [choosingDatabase, setChoosingDatabase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('basic');
  const [basicInput, setBasicInput] = useState('');
  const [advancedInput, setAdvancedInput] = useState('');
  const [appliedBasicSearch, setAppliedBasicSearch] = useState('');
  const [appliedAdvancedSql, setAppliedAdvancedSql] = useState('');

  useEffect(() => {
    if (!selectedTable) return;
    const tableName = selectedTable;
    let cancelled = false;

    async function loadTable() {
      setLoading(true);
      setError(null);
      try {
        const offset = page * PAGE_SIZE;
        const result = appliedAdvancedSql.trim()
          ? await window.dbAPI.sqlData(appliedAdvancedSql, PAGE_SIZE, offset)
          : appliedBasicSearch.trim()
            ? await window.dbAPI.searchData(
                tableName,
                PAGE_SIZE,
                offset,
                appliedBasicSearch,
              )
            : await window.dbAPI.tableData(tableName, PAGE_SIZE, offset);

        if (!cancelled) {
          setColumns(result.columns);
          setRows(result.rows);
          setTotal(result.total);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTable();
    return () => {
      cancelled = true;
    };
  }, [selectedTable, page, appliedBasicSearch, appliedAdvancedSql]);

  async function chooseDatabase() {
    setChoosingDatabase(true);
    setError(null);
    try {
      const path = await window.dbAPI.chooseDatabase();
      if (!path) return;
      const nextTables = await window.dbAPI.tables();
      setDatabasePath(path);
      setTables(nextTables);
      setSelectedTable(null);
      setRows([]);
      setColumns([]);
      setPage(0);
      setSearchMode('basic');
      setBasicInput('');
      setAdvancedInput('');
      setAppliedBasicSearch('');
      setAppliedAdvancedSql('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChoosingDatabase(false);
    }
  }

  function selectTable(tableName: string) {
    setSelectedTable(tableName);
    setPage(0);
    setBasicInput('');
    setAppliedBasicSearch('');
    const defaultSql = `SELECT * FROM "${tableName.replaceAll('"', '""')}"`;
    setAdvancedInput(defaultSql);
    setAppliedAdvancedSql('');
  }

  function applySearch() {
    if (!selectedTable) return;

    setError(null);
    setPage(0);
    if (searchMode === 'basic') {
      setAppliedBasicSearch(basicInput.trim());
      setAppliedAdvancedSql('');
      return;
    }

    const sql = advancedInput.trim();
    if (!sql) {
      setError('Enter a SELECT query for advanced mode.');
      return;
    }

    setAppliedAdvancedSql(sql);
    setAppliedBasicSearch('');
  }

  function clearSearch() {
    setError(null);
    setPage(0);
    setBasicInput('');
    setAppliedBasicSearch('');
    setAppliedAdvancedSql('');
    if (selectedTable) {
      setAdvancedInput(
        `SELECT * FROM "${selectedTable.replaceAll('"', '""')}"`,
      );
    } else {
      setAdvancedInput('');
    }
  }

  return {
    databasePath,
    tables,
    selectedTable,
    columns,
    rows,
    total,
    page,
    loading,
    choosingDatabase,
    error,
    searchMode,
    setSearchMode,
    basicInput,
    setBasicInput,
    advancedInput,
    setAdvancedInput,
    chooseDatabase,
    selectTable,
    applySearch,
    clearSearch,
    setPage,
    pageSize: PAGE_SIZE,
  };
}
