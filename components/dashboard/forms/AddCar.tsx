import {
	Button,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
	Image,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	Grid,
	Modal,
	CircularProgress,
	CircularProgressLabel,
	Heading,
	ModalBody,
	ModalContent,
	ModalOverlay,
	useToast,
	useColorModeValue,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";
import { InputField } from "./InputField";

const CarSchema = yup.object().shape({
	title: yup.string().trim().min(5, "Use at least 5 characters").max(300, "Keep the title under 300 characters").required("A listing title is required"),
	description: yup.string().max(10000, "Keep the description under 10,000 characters"),
	model: yup.string(),
	price: yup.number().typeError("Enter a valid price").min(0, "Price cannot be negative").required("A price is required"),
	files: yup.array().min(1, "Add at least one photo before submitting").max(10, "You can add up to 10 photos"),
	rent: yup.boolean(),
});

export const AddCar = ({ user }) => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const common = lang.businessListing;
	const text = lang.vehicleListing;
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const [uploadProgress, setUploadProgress] = useState(0);

	const initialValues = {
		title: "",
		description: "",
		price: 0.0,
		priceType: "FIXED",
		itemType: "CAR",
		files: [],

		model: "",
		status: "USED",
		manufacturer: "",
		year: new Date().getFullYear(),
		transmition: "AUTO",
		color: "",
		cylinder: 0.0,
		fuel: 0.0,
	};

	const onSubmit = (values, actions) => {
		const formdata = new FormData();
		const { files, ...others } = values;

		for (let key in others) {
			formdata.append(key, others[key]);
		}
		files.forEach((file) => {
			formdata.append("files", file);
		});

		actions.setSubmitting(true);

		axios
			.post("/api/items/add", formdata, {
				headers: {
					"Content-Type": "multipart/form-data",
				},

				onUploadProgress: (event) => {
					if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
				},
			})
			.then((res) => {
				const { msg } = res.data;

				toast({
					title: "Success",
					status: "success",
					description: msg,
					isClosable: true,
				});
				router.push(`/items/${res.data.itemId}`);
			})
			.catch((error) => {
				const err = error?.response?.data?.err || error?.message || "Unable to submit your listing";
				toast({
					title: "Error",
					status: "error",
					description: err,
					isClosable: true,
				});
			})
			.finally(() => {
				actions.setSubmitting(false);
			});
	};

	return (
		<Formik
			initialValues={initialValues}
			validationSchema={CarSchema}
			onSubmit={onSubmit}
		>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Flex direction="column" gap={{ base: 5, md: 6 }}>
						<Modal
							closeOnOverlayClick={false}
							closeOnEsc={false}
							onClose={() => {}}
							isOpen={formik.isSubmitting}
						>
							<ModalOverlay></ModalOverlay>
							<ModalContent p="10">
								<ModalBody
									display={"flex"}
									flexDirection={"column"}
									alignItems={"center"}
									justifyContent="center"
								>
									<CircularProgress
										size={"150px"}
										value={uploadProgress}
									>
										<CircularProgressLabel>
											{uploadProgress}%
										</CircularProgressLabel>
									</CircularProgress>
									<Heading mt="4" fontSize="lg">
										{text.uploading}
									</Heading>
								</ModalBody>
							</ModalContent>
						</Modal>
						<SimpleGrid spacing="5">
							<InputField
								formik={formik}
								label={common.title}
								name="title"
								type="text"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2, 3]} spacing="5">
							<FormControl>
								<FormLabel htmlFor="priceType">{common.priceType}</FormLabel>
								<Select
									id="priceType"
									name="priceType"
									value={formik.values.priceType}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="FIXED">{common.fixed}</option>
									<option value="NEGOTIABLE">
										{common.negotiable}
									</option>
								</Select>
							</FormControl>
							<InputField
								formik={formik}
								label={common.price}
								name="price"
								type="number"
								suffix={<Text>ETB</Text>}
							/>
							<FormControl>
								<FormLabel htmlFor="status">{text.status}</FormLabel>
								<Select
									id="status"
									name="status"
									value={formik.values.status}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="USED">{text.used}</option>
									<option value="NEW">{text.new}</option>
									<option value="NEW_ETH">
										{text.newInEthiopia}
									</option>
								</Select>
							</FormControl>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2, 3]} spacing="5">
							<InputField
								formik={formik}
								label={text.manufacturer}
								name="manufacturer"
								type="text"
							/>
							<InputField
								formik={formik}
								label={text.model}
								name="model"
								type="text"
							/>
							<InputField
								formik={formik}
								label={text.year}
								name="year"
								type="number"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5">
							<FormControl>
								<FormLabel htmlFor="transmition">{text.transmission}</FormLabel>
								<Select
									id="transmition"
									name="transmition"
									value={formik.values.transmition}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="MANUAL">{text.manual}</option>
									<option value="AUTO">{text.automatic}</option>
								</Select>
							</FormControl>

							<InputField
								formik={formik}
								label={text.color}
								name="color"
								type="text"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5">
							<InputField
								formik={formik}
								label={text.fuel}
								name="fuel"
								type="number"
					suffix={<Text>{text.fuelUnit}</Text>}
							/>
							<InputField
								formik={formik}
								label={text.cylinder}
								name="cylinder"
								type="number"
							/>
						</SimpleGrid>
						<FormControl
							isInvalid={!!formik.errors.description}
						>
							<FormLabel htmlFor="description">{common.description}</FormLabel>
							<Textarea
								id="description"
								variant="filled"
								name="description"
								value={formik.values.description}
								onChange={formik.handleChange}
								placeholder={common.description}
							></Textarea>
							{!!formik.errors.description && (
								<FormErrorMessage>
									{formik.errors.description}
								</FormErrorMessage>
							)}
						</FormControl>
						<FormControl isInvalid={!!formik.errors.files && !!formik.touched.files}>
							<FormLabel htmlFor="car-photos">{common.photos}</FormLabel>
							<Input
								id="car-photos"
								onChange={(ev) => {
									const files = ev.target.files;
									formik.setFieldValue(
										"files",
									Array.from(files || [])
									);
								formik.setFieldTouched("files", true, false);
								}}
								variant={"filled"}
								h="auto"
								minH="12"
								py="2"
								sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }}
								type="file"
								name="files"
								accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
								placeholder="images"
								multiple
							></Input>
							{formik.errors.files && formik.touched.files ? (
								<FormErrorMessage>{String(formik.errors.files)}</FormErrorMessage>
							) : (
								<Text mt="2" color="gray.500" fontSize="sm">Choose 1–10 JPG, PNG, WebP, or GIF photos (up to 8 MB each).</Text>
							)}
						</FormControl>
						<Grid
							gridTemplateColumns="repeat(auto-fit, 200px)"
							gap={"5"}
						>
							{formik.values.files.map((file, index) => {
								return (
									<Image
										alt={"Selected listing photo " + (index + 1)}
										key={index}
										background={"black"}
										boxShadow="md"
										borderRadius={"md"}
										width={"200px"}
										height={"200px"}
										objectFit="contain"
										src={URL.createObjectURL(file)}
									></Image>
								);
							})}
						</Grid>
						<Flex justifyContent={{ base: "stretch", sm: "flex-end" }} gap="3" direction={{ base: "column-reverse", sm: "row" }}>
							<Button
								colorScheme="orange"
								w={{ base: "full", sm: "auto" }}
								leftIcon={<MdSave />}
								type="submit"
								isDisabled={formik.isSubmitting}
							>
								{formik.isSubmitting ? text.submitting : text.submit}
							</Button>
							<Button type="button" w={{ base: "full", sm: "auto" }} leftIcon={<MdClose />} onClick={() => router.push("/dashboard")}>{common.cancel}</Button>
						</Flex>{" "}
					</Flex>
				</form>
			)}
		</Formik>
	);
};
