/* eslint-disable */
import React, { useEffect } from 'react';
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Progress,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Card from 'components/card/Card';
import Menu from 'components/menu/MainMenu';
import {
  MdCancel,
  MdCheckCircle,
  MdHourglassEmpty,
  MdOutlineError,
} from 'react-icons/md';
import { LuRefreshCcw } from 'react-icons/lu';
import { format } from 'utils/datetime';
import AddressCopier from 'components/addresscopier';
import { addressShortener } from 'utils';
import { VAULT_CONTRACT_ADDRESS } from 'utils/const';
const columnHelper = createColumnHelper();

export default function ComplexTable(props) {
  const { tableData, query, historyData } = props;
  const [sorting, setSorting] = React.useState([]);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const iconColor = useColorModeValue('brand.500', 'white');
  const bgList = useColorModeValue('white', 'whiteAlpha.100');
  const bgShadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.08)',
    'unset',
  );
  const bgButton = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const bgHover = useColorModeValue(
    { bg: 'secondaryGray.400' },
    { bg: 'whiteAlpha.50' },
  );
  const bgFocus = useColorModeValue(
    { bg: 'secondaryGray.300' },
    { bg: 'whiteAlpha.100' },
  );

  let defaultData = historyData.map((e) => {
    const isVaultAction = ['deposit_vault', 'withdraw_vault'].includes(
      e?.action,
    );
    const isSwapAction = e?.action == 'swap_token';
    return {
      id: e._id,
      action: e.action,
      amount: e.arguments?.amount ?? '-',
      token: e.arguments?.token ?? '-',
      recipient: isVaultAction
        ? VAULT_CONTRACT_ADDRESS?.packageId
        : e.arguments?.recipient ?? '-',
      status: e.status,
      date: e.updatedAt || e.createdAt,
      txHash: e.txHash ?? '',
      from: e.arguments?.from_token ?? '-',
      to: e.arguments?.to_token ?? '-',
      isSwapAction,
    };
  });
  const statusMeta = {
    verified: {
      icon: MdCheckCircle,
      color: 'green.500',
      label: 'Success',
    },
    rejected: {
      icon: MdCancel,
      color: 'red.500',
      label: 'Rejected',
    },
    failed: {
      icon: MdOutlineError,
      color: 'orange.500',
      label: 'Failed',
    },
    pending: {
      icon: MdHourglassEmpty,
      color: 'orange.300',
      label: 'Pending',
    },
  };
  const columns = [
    columnHelper.accessor('action', {
      id: 'action',
      header: () => (
        <Text
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          ACTION
        </Text>
      ),
      cell: (info) => (
        <Text fontWeight="700" fontSize="sm" color={textColor}>
          {info
            .getValue()
            ?.replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </Text>
      ),
    }),
    columnHelper.accessor(
      (row) => `${row?.amount} ${row?.isSwapAction ? row?.from : row?.token}`,
      {
        id: 'amount',
        header: () => (
          <Text
            align="center"
            fontSize={{ sm: '10px', lg: '12px' }}
            color="gray.400"
          >
            AMOUNT
          </Text>
        ),
        cell: (info) => (
          <Text fontWeight="700" fontSize="sm" color={textColor}>
            {info.getValue().toUpperCase()}
          </Text>
        ),
      },
    ),
    columnHelper.accessor(
      (row) => (row?.isSwapAction ? row?.to : row?.recipient || '-'),
      {
        id: 'recipient',
        header: () => (
          <Text
            align="center"
            fontSize={{ sm: '10px', lg: '12px' }}
            color="gray.400"
          >
            TO
          </Text>
        ),
        cell: (info) => {
          const isSwap = info.row.original.isSwapAction;
          if (isSwap)
            return (
              <Text fontWeight="700" fontSize="sm" color={textColor}>
                {info.getValue().toUpperCase()}
              </Text>
            );
          return (
            <Text fontSize="sm" color={textColor}>
              <AddressCopier address={info.getValue()} />
            </Text>
          );
        },
      },
    ),
    columnHelper.accessor('status', {
      id: 'status',
      header: () => (
        <Text
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          STATUS
        </Text>
      ),
      cell: (info) => {
        const meta = statusMeta[info.getValue()] || {};
        return (
          <Flex align="center">
            <Icon
              as={meta.icon}
              w="20px"
              h="20px"
              mr="5px"
              color={meta.color}
            />
            <Text fontWeight="700" fontSize="sm" color={meta.color}>
              {meta.label || info.getValue()}
            </Text>
          </Flex>
        );
      },
    }),
    columnHelper.accessor('updatedAt', {
      id: 'date',
      header: () => (
        <Text
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          DATE
        </Text>
      ),
      cell: (info) => (
        <Text fontSize="sm" color={textColor}>
          {format(info.getValue(), 'MMM Do YY')}
        </Text>
      ),
    }),
    columnHelper.accessor('txHash', {
      id: 'txHash',
      header: () => (
        <Text
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          TX
        </Text>
      ),
      cell: (info) =>
        info.getValue() ? (
          <a
            href={`https://explorer.aptoslabs.com/txn/${info.getValue()}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text color="blue.400" fontSize="sm" isTruncated maxW="120px">
              {addressShortener(info.getValue())}
            </Text>
          </a>
        ) : (
          <Text fontSize="sm" color="gray.400">
            -
          </Text>
        ),
    }),
  ];

  const [data, setData] = React.useState(() => [...defaultData]);
  useEffect(() => {
    setData(
      historyData.map((e) => {
        const isVaultAction = ['deposit_vault', 'withdraw_vault'].includes(
          e?.action,
        );
        const isSwapAction = e?.action == 'swap_token';
        return {
          id: e._id,
          action: e.action,
          amount: e.arguments?.amount ?? '-',
          token: e.arguments?.token ?? '-',
          recipient: isVaultAction
            ? VAULT_CONTRACT_ADDRESS?.packageId
            : e.arguments?.recipient ?? '-',
          status: e.status,
          date: e.updatedAt || e.createdAt,
          txHash: e.txHash ?? '',
          from: e.arguments?.from_token ?? '-',
          to: e.arguments?.to_token ?? '-',
          isSwapAction,
        };
      }),
    );
  }, [historyData]);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });
  return (
    <Card
      flexDirection="column"
      w="100%"
      px="0px"
      overflowX={{ sm: 'scroll', lg: 'hidden' }}
    >
      <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
        <Text
          color={textColor}
          fontSize="22px"
          fontWeight="700"
          lineHeight="100%"
        >
          History
        </Text>
        <IconButton
          aria-label="refresh-data"
          icon={<LuRefreshCcw />}
          align="center"
          justifyContent="center"
          bg={bgButton}
          _hover={bgHover}
          _focus={bgFocus}
          _active={bgFocus}
          w="37px"
          h="37px"
          lineHeight="100%"
          borderRadius="10px"
          isLoading={query.isFetching}
          onClick={() => query.refetch()}
        />
      </Flex>
      <Box>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <Th
                      key={header.id}
                      colSpan={header.colSpan}
                      pe="10px"
                      borderColor={borderColor}
                      cursor="pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Flex
                        justifyContent="space-between"
                        align="center"
                        fontSize={{ sm: '10px', lg: '12px' }}
                        color="gray.400"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: '',
                          desc: '',
                        }[header.column.getIsSorted()] ?? null}
                      </Flex>
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td
                        key={cell.id}
                        fontSize={{ sm: '14px' }}
                        minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                        borderColor="transparent"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Card>
  );
}
