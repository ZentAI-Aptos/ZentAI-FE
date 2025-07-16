import {
  Avatar,
  Box,
  Flex,
  FormLabel,
  Icon,
  IconButton,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
// Assets
import Usa from 'assets/img/dashboards/usa.png';
// Custom components
import MiniCalendar from 'components/calendar/MiniCalendar';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import React from 'react';
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
} from 'react-icons/md';
import CheckTable from 'views/admin/default/components/CheckTable';
import ComplexTable from './components/ComplexTable';
import DailyTraffic from 'views/admin/default/components/DailyTraffic';
import PieCard from 'views/admin/default/components/PieCard';
import Tasks from 'views/admin/default/components/Tasks';
import WeeklyRevenue from 'views/admin/default/components/WeeklyRevenue';
import { LuRefreshCcw } from "react-icons/lu";

import {
  columnsDataCheck,
  columnsDataComplex,
} from 'views/admin/privateDashboard/variables/columnsData';
import tableDataCheck from 'views/admin/default/variables/tableDataCheck.json';
import tableDataComplex from 'views/admin/privateDashboard/variables/tableDataComplex.json';
import TotalSpent from 'views/admin/privateDashboard/components/TotalSpent';

export default function GlobalDashboard() {
  // Chakra Color Mode
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const grayColor = useColorModeValue('gray.500', 'white');
  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex justify="space-between" align="center" mt="20px">
        <Text color={grayColor} fontWeight="bold" textAlign="left" fontSize="24px">
          Overview Metrics
        </Text>
        <IconButton
          mb="-4px"
          ml={0}
          aria-label="refresh-data"
          icon={<LuRefreshCcw />}
          size="lg"
          variant="ghost"
          colorScheme="blue"
          bg={boxBg}
        />
      </Flex>
      {/* <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
        <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px'>
          <DailyTraffic />
          <PieCard />
        </SimpleGrid>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
        <ComplexTable
          columnsData={columnsDataComplex}
          tableData={tableDataComplex}
        />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px'>
          <Tasks />
          <MiniCalendar h='100%' minW='100%' selectRange={false} />
        </SimpleGrid>
      </SimpleGrid> */}
      <ComplexTable
        columnsData={columnsDataComplex}
        tableData={tableDataComplex}
      />
    </Box>
  );
}
